<?php

namespace App\Landing\Builder;

use App\Landing\Support\Sanitizer;

/**
 * Base class for every builder element. A subclass declares its identity,
 * defaults, editable controls and renderer; nothing else in the system
 * (editor UI, sanitiser, style compiler) needs to know about it.
 */
abstract class AbstractElement
{
    abstract public function type(): string;

    abstract public function label(): string;

    /** layout | basic | content | marketing | advanced */
    abstract public function category(): string;

    /** @return list<Control-array> */
    abstract protected function contentControls(): array;

    abstract public function render(array $node, string $children, RenderContext $ctx): string;

    public function icon(): string
    {
        return $this->type();
    }

    /** Child types this element accepts. ['*'] = any element except section/column. */
    public function accepts(): array
    {
        return [];
    }

    /** @return array{content:array,settings:array,children:array} */
    public function defaults(): array
    {
        return ['content' => [], 'settings' => [], 'children' => []];
    }

    /** Style groups shown in the Style tab. */
    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects'];
    }

    /** Advanced tab groups. */
    protected function advancedGroups(): array
    {
        return ['spacing', 'visibility', 'animation', 'attributes'];
    }

    /** Extra controls for the Style tab (element specific). */
    protected function styleControls(): array
    {
        return [];
    }

    /** CSS selector receiving the "skin" settings (colour, border, ...). */
    public function skinSelector(string $root): string
    {
        return $root;
    }

    /** Optional selector receiving the "inner" scope keys (grid gaps ...). */
    public function innerSelector(string $root): ?string
    {
        return null;
    }

    /** Element specific CSS (sub-selectors, grids, ...). */
    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return '';
    }

    // ------------------------------------------------------------------
    // Schema
    // ------------------------------------------------------------------

    public function controls(): array
    {
        return array_merge(
            $this->contentControls(),
            $this->styleControls(),
            $this->commonStyleControls(),
            $this->advancedControls(),
        );
    }

    public function schema(): array
    {
        return [
            'type' => $this->type(),
            'label' => $this->label(),
            'category' => $this->category(),
            'icon' => $this->icon(),
            'accepts' => $this->accepts(),
            'defaults' => $this->defaults(),
            'controls' => $this->controls(),
        ];
    }

    private function commonStyleControls(): array
    {
        $c = [];
        $groups = $this->styleGroups();
        $S = fn (string $section, array $o = []) => $o + ['tab' => 'style', 'section' => $section];

        if (in_array('typography', $groups, true)) {
            $c[] = Control::select('font_family', 'Font family', [
                '' => 'Inherit', 'system' => 'System UI', 'serif' => 'Serif', 'mono' => 'Monospace',
                'Inter' => 'Inter', 'Poppins' => 'Poppins', 'Roboto' => 'Roboto', 'Montserrat' => 'Montserrat',
                'Open Sans' => 'Open Sans', 'Lato' => 'Lato', 'Playfair Display' => 'Playfair Display',
                'Hind Siliguri' => 'Hind Siliguri (Bangla)',
            ], $S('Typography'));
            $c[] = Control::text('font_size', 'Font size', $S('Typography', ['responsive' => true, 'placeholder' => '16px']));
            $c[] = Control::select('font_weight', 'Font weight', [
                '' => 'Inherit', '300' => 'Light', '400' => 'Regular', '500' => 'Medium', '600' => 'Semi-bold', '700' => 'Bold', '800' => 'Extra-bold',
            ], $S('Typography'));
            $c[] = Control::text('line_height', 'Line height', $S('Typography', ['responsive' => true, 'placeholder' => '1.5']));
            $c[] = Control::text('letter_spacing', 'Letter spacing', $S('Typography', ['responsive' => true, 'placeholder' => '0px']));
            $c[] = Control::select('text_transform', 'Transform', [
                '' => 'Default', 'none' => 'None', 'uppercase' => 'UPPERCASE', 'lowercase' => 'lowercase', 'capitalize' => 'Capitalize',
            ], $S('Typography'));
            $c[] = Control::choose('align', 'Alignment', ['left' => 'Left', 'center' => 'Center', 'right' => 'Right', 'justify' => 'Justify'], $S('Typography', ['responsive' => true]));
        }
        if (in_array('color', $groups, true)) {
            $c[] = Control::color('color', 'Text color', $S('Color'));
        }
        if (in_array('background', $groups, true)) {
            $c[] = Control::select('background_type', 'Background', ['none' => 'None', 'color' => 'Color', 'gradient' => 'Gradient', 'image' => 'Image'], $S('Background'));
            $c[] = Control::color('background_color', 'Color', $S('Background', ['if' => ['background_type' => ['color']]]));
            $c[] = Control::color('gradient_from', 'From', $S('Background', ['if' => ['background_type' => ['gradient']]]));
            $c[] = Control::color('gradient_to', 'To', $S('Background', ['if' => ['background_type' => ['gradient']]]));
            $c[] = Control::number('gradient_angle', 'Angle (deg)', $S('Background', ['min' => 0, 'max' => 360, 'if' => ['background_type' => ['gradient']]]));
            $c[] = Control::image('background_image', 'Image', $S('Background', ['if' => ['background_type' => ['image']]]));
            $c[] = Control::select('background_size', 'Size', ['cover' => 'Cover', 'contain' => 'Contain', 'auto' => 'Auto'], $S('Background', ['if' => ['background_type' => ['image']]]));
            $c[] = Control::select('background_position', 'Position', [
                'center center' => 'Center', 'center top' => 'Top', 'center bottom' => 'Bottom', 'left center' => 'Left', 'right center' => 'Right',
            ], $S('Background', ['if' => ['background_type' => ['image']]]));
            $c[] = Control::color('overlay_color', 'Overlay color', $S('Background', ['if' => ['background_type' => ['image']]]));
            $c[] = Control::slider('overlay_opacity', 'Overlay opacity', $S('Background', ['min' => 0, 'max' => 1, 'step' => 0.05, 'if' => ['background_type' => ['image']]]));
        }
        if (in_array('border', $groups, true)) {
            $c[] = Control::dimensions('border_width', 'Border width', $S('Border', ['responsive' => false]));
            $c[] = Control::select('border_style', 'Border style', ['solid' => 'Solid', 'dashed' => 'Dashed', 'dotted' => 'Dotted', 'double' => 'Double'], $S('Border'));
            $c[] = Control::color('border_color', 'Border color', $S('Border'));
            $c[] = Control::dimensions('border_radius', 'Radius', $S('Border', ['responsive' => false]));
        }
        if (in_array('effects', $groups, true)) {
            $c[] = Control::select('box_shadow', 'Box shadow', ['' => 'Default', 'none' => 'None', 'sm' => 'Small', 'md' => 'Medium', 'lg' => 'Large', 'xl' => 'Extra large'], $S('Effects'));
            $c[] = Control::slider('opacity', 'Opacity', $S('Effects', ['min' => 0, 'max' => 1, 'step' => 0.05]));
        }
        if (in_array('size', $groups, true)) {
            $c[] = Control::text('width', 'Width', $S('Size', ['responsive' => true, 'placeholder' => '100% / 480px']));
            $c[] = Control::text('max_width', 'Max width', $S('Size', ['responsive' => true, 'placeholder' => '1140px']));
            $c[] = Control::text('min_height', 'Min height', $S('Size', ['responsive' => true, 'placeholder' => '400px']));
        }

        return $c;
    }

    private function advancedControls(): array
    {
        $groups = $this->advancedGroups();
        $A = fn (string $section, array $o = []) => $o + ['tab' => 'advanced', 'section' => $section];
        $c = [];

        if (in_array('spacing', $groups, true)) {
            $c[] = Control::dimensions('margin', 'Margin', $A('Spacing'));
            $c[] = Control::dimensions('padding', 'Padding', $A('Spacing'));
        }
        if (in_array('visibility', $groups, true)) {
            $c[] = Control::switch('hide_desktop', 'Hide on desktop', $A('Responsive visibility'));
            $c[] = Control::switch('hide_tablet', 'Hide on tablet', $A('Responsive visibility'));
            $c[] = Control::switch('hide_mobile', 'Hide on mobile', $A('Responsive visibility'));
        }
        if (in_array('animation', $groups, true)) {
            $c[] = Control::select('animation', 'Entrance animation', [
                '' => 'None', 'fade-in' => 'Fade in', 'fade-up' => 'Fade up', 'fade-down' => 'Fade down',
                'zoom-in' => 'Zoom in', 'slide-left' => 'Slide from left', 'slide-right' => 'Slide from right',
            ], $A('Motion'));
        }
        if (in_array('attributes', $groups, true)) {
            $c[] = Control::text('css_class', 'CSS classes', $A('Attributes'));
            $c[] = Control::text('css_id', 'CSS ID', $A('Attributes'));
            $c[] = Control::code('custom_css', 'Custom CSS', $A('Attributes', ['language' => 'css', 'help' => 'Use "selector" to target this element.']));
        }

        return $c;
    }

    // ------------------------------------------------------------------
    // Sanitising stored JSON by control type
    // ------------------------------------------------------------------

    public function sanitizeNode(array $node, bool $allowCustomCode = true): array
    {
        $controls = $this->controls();
        $content = is_array($node['content'] ?? null) ? $node['content'] : [];
        $settings = is_array($node['settings'] ?? null) ? $node['settings'] : [];

        $byStore = ['content' => [], 'settings' => []];
        foreach ($controls as $ctl) {
            $byStore[$ctl['store']][$ctl['key']] = $ctl;
        }

        foreach ($content as $k => $v) {
            $content[$k] = isset($byStore['content'][$k]) ? $this->sanitizeValue($byStore['content'][$k], $v, $allowCustomCode) : $this->scalarOnly($v);
        }
        foreach ($settings as $k => $v) {
            $settings[$k] = isset($byStore['settings'][$k]) ? $this->sanitizeValue($byStore['settings'][$k], $v, $allowCustomCode) : $this->scalarOnly($v);
        }

        $node['content'] = $content;
        $node['settings'] = $settings;

        return $node;
    }

    private function sanitizeValue(array $ctl, mixed $v, bool $allowCustomCode): mixed
    {
        switch ($ctl['type']) {
            case 'richtext':
                return is_string($v) ? Sanitizer::html($v, 'rich') : '';
            case 'url':
            case 'image':
                return is_string($v) ? Sanitizer::url($v, ['http', 'https', 'mailto', 'tel']) : '';
            case 'code':
                if (! is_string($v)) {
                    return '';
                }
                if (($ctl['language'] ?? '') === 'css') {
                    return Sanitizer::css($v, '.x') === '' ? '' : mb_substr($v, 0, 20000);
                }
                if (($ctl['language'] ?? '') === 'html') {
                    return Sanitizer::html($v, 'html');
                }

                // Raw code (custom_code element): kept only for authorised users.
                return $allowCustomCode ? mb_substr($v, 0, 100000) : '';
            case 'repeater':
                if (! is_array($v)) {
                    return [];
                }
                $out = [];
                foreach (array_slice(array_values($v), 0, 60) as $item) {
                    if (! is_array($item)) {
                        continue;
                    }
                    $clean = [];
                    $fields = [];
                    foreach ($ctl['fields'] as $f) {
                        $fields[$f['key']] = $f;
                    }
                    foreach ($item as $k => $iv) {
                        $clean[$k] = isset($fields[$k]) ? $this->sanitizeValue($fields[$k], $iv, $allowCustomCode) : $this->scalarOnly($iv);
                    }
                    $out[] = $clean;
                }

                return $out;
            default:
                return $this->scalarOnly($v);
        }
    }

    /** Free values: keep scalars/arrays of scalars, drop objects and deep nesting. */
    private function scalarOnly(mixed $v, int $depth = 0): mixed
    {
        if (is_string($v)) {
            return mb_substr($v, 0, 5000);
        }
        if (is_bool($v) || is_int($v) || is_float($v) || $v === null) {
            return $v;
        }
        if (is_array($v) && $depth < 3) {
            $out = [];
            foreach ($v as $k => $item) {
                $out[is_int($k) ? $k : mb_substr((string) $k, 0, 60)] = $this->scalarOnly($item, $depth + 1);
            }

            return $out;
        }

        return null;
    }

    // ------------------------------------------------------------------
    // Rendering helpers
    // ------------------------------------------------------------------

    public static function safeId(?string $id): string
    {
        return preg_replace('/[^A-Za-z0-9_-]/', '', (string) $id);
    }

    public static function rootSelector(array $node): string
    {
        return '.lp-e-'.self::safeId($node['id'] ?? '');
    }

    protected function c(array $node, string $key, mixed $default = null): mixed
    {
        $v = $node['content'][$key] ?? null;

        return ($v === null || $v === '') ? $default : $v;
    }

    protected function s(array $node, string $key, mixed $default = null): mixed
    {
        $v = $node['settings'][$key] ?? null;

        return ($v === null || $v === '') ? $default : $v;
    }

    /** Opening tag with common classes / id / editor data attributes. */
    protected function open(array $node, RenderContext $ctx, string $tag = 'div', array $classes = [], array $attrs = []): string
    {
        $cls = array_merge(['lp-e', 'lp-e-'.self::safeId($node['id'] ?? ''), 'lp-'.str_replace('_', '-', $this->type())], $classes);

        if ($extra = Sanitizer::token($node['settings']['css_class'] ?? '', true)) {
            $cls[] = $extra;
        }
        $anim = Sanitizer::enum($node['settings']['animation'] ?? '', ['fade-in', 'fade-up', 'fade-down', 'zoom-in', 'slide-left', 'slide-right']);
        if ($anim && ! $ctx->editing) {
            $cls[] = 'lp-anim lp-anim-'.$anim;
            $ctx->hasAnimations = true;
        }

        $attrs['class'] = implode(' ', $cls);
        if ($cssId = Sanitizer::token($node['settings']['css_id'] ?? '')) {
            $attrs['id'] = $cssId;
        }
        if ($ctx->editing) {
            $attrs['data-lp-id'] = $node['id'] ?? '';
            $attrs['data-lp-type'] = $this->type();
        }

        return '<'.$tag.$this->attrs($attrs).'>';
    }

    protected function attrs(array $attrs): string
    {
        $out = '';
        foreach ($attrs as $k => $v) {
            if ($v === null || $v === false) {
                continue;
            }
            $out .= $v === true ? ' '.$k : ' '.$k.'="'.e((string) $v).'"';
        }

        return $out;
    }

    protected function kids(string $children, RenderContext $ctx, string $hint = 'Drop an element here'): string
    {
        if ($children === '' && $ctx->editing) {
            return '<div class="lp-empty" data-lp-empty>'.e($hint).'</div>';
        }

        return $children;
    }

    protected function tag(mixed $value, array $allowed, string $default): string
    {
        return in_array($value, $allowed, true) ? $value : $default;
    }

    // ---- responsive card grids (team, pricing, gallery, logos ...) -----

    protected function columnsControl(): array
    {
        return Control::number('columns', 'Columns', ['tab' => 'content', 'store' => 'settings', 'responsive' => true, 'min' => 1, 'max' => 6, 'section' => 'Layout']);
    }

    protected function gridCss(array $node, string $selector, array $default = ['desktop' => 3, 'tablet' => 2, 'mobile' => 1]): string
    {
        $r = StyleCompiler::resolve($node['settings']['columns'] ?? $default);
        $css = new CssBuilder;
        $per = [];
        foreach (['mobile', 'tablet', 'desktop'] as $dev) {
            $n = (int) ($r[$dev] ?? $default[$dev]);
            $n = max(1, min(6, $n));
            $per[$dev] = "repeat({$n},minmax(0,1fr))";
        }
        $css->add($selector, 'grid-template-columns', $per);

        return $css->toString();
    }

    // ---- tracking (click / submit events attached to an element) ------

    protected function trackingControls(string $defaultEvent = 'Lead'): array
    {
        $T = fn (array $o = []) => $o + ['tab' => 'content', 'section' => 'Tracking'];
        $events = array_combine(config('landing.tracking.standard_events'), config('landing.tracking.standard_events'));

        return [
            Control::switch('event_enabled', 'Track this element', $T()),
            Control::select('event_name', 'Event', $events, $T(['default' => $defaultEvent, 'if' => ['event_enabled' => [true]]])),
            Control::text('event_custom_name', 'Custom event name', $T(['if' => ['event_name' => ['CustomEvent']]])),
            Control::switch('event_browser', 'Send via Meta Pixel (browser)', $T(['default' => true, 'if' => ['event_enabled' => [true]]])),
            Control::switch('event_server', 'Send via Conversions API (server)', $T(['default' => true, 'if' => ['event_enabled' => [true]]])),
        ];
    }

    /** Normalised tracking config for a node, or null when tracking is off. */
    public static function trackingConfig(array $node, string $trigger = 'click'): ?array
    {
        $c = $node['content'] ?? [];
        if (empty($c['event_enabled'])) {
            return null;
        }
        $name = Sanitizer::enum($c['event_name'] ?? 'Lead', config('landing.tracking.standard_events')) ?? 'Lead';
        if ($name === 'CustomEvent') {
            $custom = preg_replace('/[^A-Za-z0-9_]/', '', (string) ($c['event_custom_name'] ?? ''));
            $name = $custom !== '' ? substr($custom, 0, 40) : 'CustomEvent';
        }

        return [
            'element_id' => $node['id'] ?? '',
            'type' => $node['type'] ?? '',
            'trigger' => $trigger,
            'event' => $name,
            'browser' => ! array_key_exists('event_browser', $c) || (bool) $c['event_browser'],
            'server' => ! array_key_exists('event_server', $c) || (bool) $c['event_server'],
        ];
    }

    protected function trackAttrs(array $node, RenderContext $ctx, string $trigger = 'click'): array
    {
        $cfg = self::trackingConfig($node, $trigger);
        if (! $cfg) {
            return [];
        }
        $ctx->trackedElements[$cfg['element_id']] = $cfg;

        return [
            'data-lp-ev' => self::safeId($cfg['element_id']),
            'data-lp-en' => $cfg['event'],
            'data-lp-eb' => $cfg['browser'] ? '1' : '0',
        ];
    }
}
