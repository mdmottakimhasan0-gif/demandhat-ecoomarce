<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Icons;
use App\Landing\Support\Sanitizer;

class ButtonElement extends AbstractElement
{
    public function type(): string
    {
        return 'button';
    }

    public function label(): string
    {
        return 'Button';
    }

    public function category(): string
    {
        return 'basic';
    }

    public function defaults(): array
    {
        return [
            'content' => ['text' => 'Book Consultation', 'url' => '#', 'target' => '_self', 'size' => 'md', 'icon_position' => 'after'],
            'settings' => [
                'align' => ['desktop' => 'left'],
                'background_type' => 'color',
                'background_color' => '#2563eb',
                'color' => '#ffffff',
                'hover_background' => '#1d4ed8',
                'border_radius' => '8px',
                'font_weight' => '600',
            ],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return array_merge([
            Control::text('text', 'Text', ['default' => 'Click here']),
            Control::url('url', 'Link', ['placeholder' => 'https://... or #form']),
            Control::select('target', 'Open link', ['_self' => 'Same tab', '_blank' => 'New tab'], ['default' => '_self']),
            Control::icon('icon', 'Icon'),
            Control::choose('icon_position', 'Icon position', ['before' => 'Before', 'after' => 'After'], ['default' => 'after']),
            Control::choose('size', 'Size', ['sm' => 'S', 'md' => 'M', 'lg' => 'L'], ['default' => 'md']),
        ], $this->trackingControls('Lead'));
    }

    protected function styleControls(): array
    {
        $S = fn (array $o = []) => $o + ['tab' => 'style', 'section' => 'Hover'];

        return [
            Control::color('hover_background', 'Hover background', $S()),
            Control::color('hover_color', 'Hover text color', $S()),
            Control::color('hover_border_color', 'Hover border color', $S()),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects'];
    }

    public function skinSelector(string $root): string
    {
        return $root.' .lp-btn';
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $ctx->useFont($node['settings']['font_family'] ?? null);

        return '';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $size = $this->tag($this->c($node, 'size', 'md'), ['sm', 'md', 'lg'], 'md');
        $icon = Icons::svg($this->c($node, 'icon'), 'lp-icon');
        $pos = $this->c($node, 'icon_position', 'after');
        $inner = ($pos === 'before' ? $icon : '').'<span>'.e((string) $this->c($node, 'text', 'Button')).'</span>'.($pos !== 'before' ? $icon : '');

        $url = Sanitizer::url($this->c($node, 'url', '#')) ?: '#';
        $blank = $this->c($node, 'target') === '_blank';

        $attrs = ['class' => 'lp-btn lp-btn-'.$size, 'href' => $url]
            + ($blank ? ['target' => '_blank', 'rel' => 'noopener noreferrer'] : [])
            + $this->trackAttrs($node, $ctx, 'click');

        return $this->open($node, $ctx).'<a'.$this->attrs($attrs).'>'.$inner.'</a></div>';
    }
}
