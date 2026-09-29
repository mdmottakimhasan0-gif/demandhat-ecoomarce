<?php

namespace App\Landing\Builder;

use App\Landing\Support\Sanitizer;
use App\Models\LandingPageSetting;

/**
 * Turns builder JSON into safe HTML + CSS. Input is never trusted: every element
 * sanitises what it prints, and unknown element types degrade to a harmless fallback.
 */
class LandingPageRenderer
{
    public function __construct(
        private ElementRegistry $registry,
        private StyleCompiler $styles,
    ) {}

    public function registry(): ElementRegistry
    {
        return $this->registry;
    }

    /**
     * @param  array  $content  builder JSON
     * @param  array  $settings  page settings (fonts, colours, custom CSS ...)
     * @return array{body:string,css:string,fonts:list<string>,flags:array,tracked:array}
     */
    public function compile(array $content, array $settings, RenderContext $ctx): array
    {
        $ctx->settings = $settings;
        if (! empty($settings['product_id'])) {
            $ctx->product = \App\Models\Product::with('images')->find($settings['product_id']);
        }

        $html = '';
        foreach ((array) ($content['sections'] ?? []) as $section) {
            $html .= $this->node($section, $ctx);
        }

        if ($html === '' && $ctx->editing) {
            $html = '<div class="lp-empty-page" data-lp-empty-page>Drag a Section from the left panel to start building.</div>';
        }

        return [
            'body' => $html,
            'css' => $this->pageCss($settings, $ctx),
            'fonts' => array_keys($ctx->fonts),
            'flags' => [
                'animations' => $ctx->hasAnimations,
                'form' => $ctx->hasForm,
                'countdown' => $ctx->hasCountdown,
                'custom_code' => $ctx->hasCustomCode,
            ],
            'tracked' => $ctx->trackedElements,
        ];
    }

    private function node(mixed $node, RenderContext $ctx): string
    {
        if (! is_array($node) || ! isset($node['type'])) {
            return '';
        }

        $el = $this->registry->get($node['type']);
        if (! $el) {
            return $ctx->editing
                ? '<div class="lp-unsupported" data-lp-id="'.e($node['id'] ?? '').'" data-lp-type="unsupported">Unsupported element: '.e((string) $node['type']).'</div>'
                : '<!-- unsupported element -->';
        }

        $node['content'] = is_array($node['content'] ?? null) ? $node['content'] : [];
        $node['settings'] = is_array($node['settings'] ?? null) ? $node['settings'] : [];
        $node['id'] = (string) ($node['id'] ?? '');

        $root = AbstractElement::rootSelector($node);
        $ctx->useFont($node['settings']['font_family'] ?? null);

        // Element defaults first so user settings (same specificity, later) win.
        $ctx->addCss($el->extraCss($node, $root, $ctx));
        $ctx->addCss($this->styles->compile($node['settings'], $root, $el->skinSelector($root), $el->innerSelector($root))->toString());

        $children = '';
        if ($el->accepts()) {
            foreach ((array) ($node['children'] ?? []) as $child) {
                $children .= $this->node($child, $ctx);
            }
        }

        try {
            return $el->render($node, $children, $ctx);
        } catch (\Throwable $e) {
            report($e);

            return $ctx->editing ? '<div class="lp-unsupported" data-lp-id="'.e($node['id']).'" data-lp-type="error">This element could not be rendered.</div>' : '';
        }
    }

    private function pageCss(array $settings, RenderContext $ctx): string
    {
        $vars = [];
        $container = (int) ($settings['container_width'] ?? LandingPageSetting::publicValue('builder.container_width', config('landing.container_widths.default')));
        $container = max(320, min(2400, $container ?: 1140));
        $vars[] = '--lp-container:'.(! empty($settings['full_width']) ? '100%' : $container.'px');

        if ($c = Sanitizer::color($settings['text_color'] ?? '')) {
            $vars[] = '--lp-text:'.$c;
        }
        if ($c = Sanitizer::color($settings['background_color'] ?? '')) {
            $vars[] = '--lp-bg:'.$c;
        }
        $font = $settings['font_family'] ?? LandingPageSetting::publicValue('builder.font_family');
        if ($stack = Sanitizer::fontFamily(is_string($font) ? $font : null)) {
            $vars[] = '--lp-font:'.$stack;
            $ctx->useFont($font);
        }

        $css = file_get_contents(resource_path('landing/landing.css'));
        $css .= ':root{'.implode(';', $vars).'}';
        $css .= $ctx->css();

        $custom = Sanitizer::css($settings['custom_css'] ?? '', 'body.lp-body');
        if ($custom !== '') {
            $css .= $custom;
        }

        return $css;
    }

    /** Google Fonts stylesheet URL for the web fonts a page uses, or null. */
    public static function fontsUrl(array $fonts): ?string
    {
        $fonts = array_values(array_filter($fonts, fn ($f) => Sanitizer::isWebFont($f)));
        if (! $fonts) {
            return null;
        }
        $families = array_map(fn ($f) => 'family='.str_replace(' ', '+', $f).':wght@400;500;600;700;800', $fonts);

        return 'https://fonts.googleapis.com/css2?'.implode('&', $families).'&display=swap';
    }
}
