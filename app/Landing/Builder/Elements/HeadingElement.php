<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class HeadingElement extends AbstractElement
{
    public function type(): string
    {
        return 'heading';
    }

    public function label(): string
    {
        return 'Heading';
    }

    public function category(): string
    {
        return 'basic';
    }

    public function defaults(): array
    {
        return [
            'content' => ['text' => 'Add Your Heading Text Here', 'tag' => 'h2'],
            'settings' => [
                'font_size' => ['desktop' => '48px', 'tablet' => '38px', 'mobile' => '30px'],
                'font_weight' => '700',
                'line_height' => '1.2',
                'align' => ['desktop' => 'left'],
            ],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [
            Control::textarea('text', 'Title', ['default' => 'Add Your Heading Text Here', 'rows' => 2]),
            Control::select('tag', 'HTML tag', ['h1' => 'H1', 'h2' => 'H2', 'h3' => 'H3', 'h4' => 'H4', 'h5' => 'H5', 'h6' => 'H6', 'div' => 'div', 'p' => 'p', 'span' => 'span'], ['default' => 'h2']),
            Control::url('link', 'Link'),
            Control::select('link_target', 'Open link', ['_self' => 'Same tab', '_blank' => 'New tab'], ['default' => '_self']),
        ];
    }

    protected function styleControls(): array
    {
        $S = fn (array $o = []) => $o + ['tab' => 'style', 'section' => 'Gradient text'];

        return [
            Control::color('text_gradient_from', 'Gradient from', $S()),
            Control::color('text_gradient_to', 'Gradient to', $S()),
            Control::number('text_gradient_angle', 'Angle (deg)', $S(['min' => 0, 'max' => 360])),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'effects'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $ctx->useFont($node['settings']['font_family'] ?? null);

        return $root.'{margin:0}'.$root.' a{color:inherit;text-decoration:none;-webkit-text-fill-color:inherit}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $tag = $this->tag($this->c($node, 'tag', 'h2'), ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'p', 'span'], 'h2');
        $text = nl2br(e((string) $this->c($node, 'text', '')));
        $link = Sanitizer::url($this->c($node, 'link', ''));
        if ($link !== '') {
            $blank = $this->c($node, 'link_target') === '_blank';
            $text = '<a href="'.e($link).'"'.($blank ? ' target="_blank" rel="noopener noreferrer"' : '').'>'.$text.'</a>';
        }

        return $this->open($node, $ctx, $tag).$text.'</'.$tag.'>';
    }
}
