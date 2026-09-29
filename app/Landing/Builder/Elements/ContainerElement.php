<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;

class ContainerElement extends AbstractElement
{
    public function type(): string
    {
        return 'container';
    }

    public function label(): string
    {
        return 'Container';
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
            'content' => [],
            'settings' => ['flex_direction' => 'column', 'gap' => '16px'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        $L = fn (array $o = []) => $o + ['tab' => 'content', 'store' => 'settings', 'section' => 'Layout', 'responsive' => true];

        return [
            Control::select('flex_direction', 'Direction', ['column' => 'Vertical', 'row' => 'Horizontal', 'column-reverse' => 'Vertical reverse', 'row-reverse' => 'Horizontal reverse'], $L()),
            Control::select('flex_wrap', 'Wrap', ['nowrap' => 'No wrap', 'wrap' => 'Wrap'], $L()),
            Control::select('align_items', 'Align items', ['stretch' => 'Stretch', 'flex-start' => 'Start', 'center' => 'Center', 'flex-end' => 'End'], $L()),
            Control::select('justify_content', 'Justify content', ['flex-start' => 'Start', 'center' => 'Center', 'flex-end' => 'End', 'space-between' => 'Space between', 'space-around' => 'Space around'], $L()),
            Control::text('gap', 'Gap', $L(['placeholder' => '16px'])),
            Control::text('max_width', 'Max width', $L(['placeholder' => '720px'])),
            Control::text('min_height', 'Min height', $L()),
        ];
    }

    protected function styleGroups(): array
    {
        return ['background', 'border', 'effects', 'typography', 'color'];
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        return $this->open($node, $ctx).$this->kids($children, $ctx).'</div>';
    }
}
