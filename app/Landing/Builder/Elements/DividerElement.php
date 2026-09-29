<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class DividerElement extends AbstractElement
{
    public function type(): string
    {
        return 'divider';
    }

    public function label(): string
    {
        return 'Divider';
    }

    public function category(): string
    {
        return 'basic';
    }

    public function defaults(): array
    {
        return ['content' => ['style' => 'solid', 'weight' => 1, 'color' => '#e5e7eb', 'width' => 100], 'settings' => ['align' => 'center'], 'children' => []];
    }

    protected function contentControls(): array
    {
        return [
            Control::select('style', 'Style', ['solid' => 'Solid', 'dashed' => 'Dashed', 'dotted' => 'Dotted', 'double' => 'Double'], ['default' => 'solid']),
            Control::number('weight', 'Weight (px)', ['min' => 1, 'max' => 20, 'default' => 1]),
            Control::color('color', 'Color', ['default' => '#e5e7eb']),
            Control::number('width', 'Width (%)', ['min' => 5, 'max' => 100, 'default' => 100]),
        ];
    }

    protected function styleGroups(): array
    {
        return [];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $style = Sanitizer::enum($this->c($node, 'style', 'solid'), ['solid', 'dashed', 'dotted', 'double']) ?? 'solid';
        $weight = Sanitizer::number($this->c($node, 'weight', 1), 1, 20) ?? '1';
        $color = Sanitizer::color($this->c($node, 'color', '#e5e7eb')) ?? '#e5e7eb';
        $width = Sanitizer::number($this->c($node, 'width', 100), 5, 100) ?? '100';

        return "{$root} hr{border:0;border-top:{$weight}px {$style} {$color};width:{$width}%;margin:0 auto}";
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        return $this->open($node, $ctx).'<hr></div>';
    }
}
