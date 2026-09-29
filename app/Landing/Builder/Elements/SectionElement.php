<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class SectionElement extends AbstractElement
{
    public function type(): string
    {
        return 'section';
    }

    public function label(): string
    {
        return 'Section';
    }

    public function category(): string
    {
        return 'layout';
    }

    public function accepts(): array
    {
        return ['*'];
    }

    public function defaults(): array
    {
        return [
            'content' => ['content_width' => 'boxed', 'html_tag' => 'section'],
            'settings' => [
                'padding' => [
                    'desktop' => ['top' => '80px', 'right' => '20px', 'bottom' => '80px', 'left' => '20px'],
                    'tablet' => ['top' => '56px', 'right' => '20px', 'bottom' => '56px', 'left' => '20px'],
                    'mobile' => ['top' => '40px', 'right' => '16px', 'bottom' => '40px', 'left' => '16px'],
                ],
                'background_type' => 'color',
                'background_color' => '#ffffff',
            ],
            'children' => [['type' => 'container', 'content' => [], 'settings' => [], 'children' => []]],
        ];
    }

    protected function contentControls(): array
    {
        return [
            Control::choose('content_width', 'Content width', ['boxed' => 'Boxed', 'full' => 'Full width', 'custom' => 'Custom'], ['default' => 'boxed']),
            Control::number('custom_width', 'Custom max width (px)', ['min' => 320, 'max' => 2400, 'if' => ['content_width' => ['custom']]]),
            Control::select('vertical_align', 'Vertical alignment', ['top' => 'Top', 'center' => 'Middle', 'bottom' => 'Bottom'], ['default' => 'top']),
            Control::text('min_height', 'Min height', ['tab' => 'content', 'store' => 'settings', 'responsive' => true, 'placeholder' => '480px']),
            Control::select('html_tag', 'HTML tag', ['section' => 'section', 'div' => 'div', 'header' => 'header', 'footer' => 'footer', 'main' => 'main', 'article' => 'article'], ['default' => 'section']),
        ];
    }

    protected function styleControls(): array
    {
        return [];
    }

    protected function styleGroups(): array
    {
        return ['background', 'border', 'effects', 'typography', 'color'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $css = '';
        $width = $this->c($node, 'content_width', 'boxed');
        if ($width === 'custom') {
            $w = (int) $this->c($node, 'custom_width', 1140);
            $w = max(320, min(2400, $w));
            $css .= "{$root}>.lp-inner{max-width:{$w}px}";
        } elseif ($width === 'full') {
            $css .= "{$root}>.lp-inner{max-width:none}";
        }

        $va = Sanitizer::enum($this->c($node, 'vertical_align', 'top'), ['top', 'center', 'bottom']);
        if ($va && $va !== 'top') {
            $css .= $root.'{display:flex;flex-direction:column;justify-content:'.($va === 'center' ? 'center' : 'flex-end').'}';
        }

        // Image background overlay
        $overlay = Sanitizer::color($node['settings']['overlay_color'] ?? '');
        if ($overlay && ($node['settings']['background_type'] ?? '') === 'image') {
            $op = Sanitizer::number($node['settings']['overlay_opacity'] ?? 0.5, 0, 1) ?? '0.5';
            $css .= "{$root}{position:relative}{$root}::before{content:\"\";position:absolute;inset:0;background:{$overlay};opacity:{$op};pointer-events:none}";
        }

        return $css;
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $tag = $this->tag($this->c($node, 'html_tag', 'section'), ['section', 'div', 'header', 'footer', 'main', 'article'], 'section');

        return $this->open($node, $ctx, $tag)
            .'<div class="lp-inner">'.$this->kids($children, $ctx, 'Drop a container or element here').'</div></'.$tag.'>';
    }
}
