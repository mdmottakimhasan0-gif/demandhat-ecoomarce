<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;

/** A single column inside a Columns element. Not offered in the element palette. */
class ColumnElement extends AbstractElement
{
    public function type(): string
    {
        return 'column';
    }

    public function label(): string
    {
        return 'Column';
    }

    public function category(): string
    {
        return 'hidden';
    }

    public function accepts(): array
    {
        return ['*'];
    }

    public function defaults(): array
    {
        return ['content' => [], 'settings' => ['gap' => '16px'], 'children' => []];
    }

    protected function contentControls(): array
    {
        $L = fn (array $o = []) => $o + ['tab' => 'content', 'store' => 'settings', 'section' => 'Layout', 'responsive' => true];

        return [
            Control::select('justify_content', 'Vertical alignment', ['flex-start' => 'Top', 'center' => 'Middle', 'flex-end' => 'Bottom', 'space-between' => 'Space between'], $L(['responsive' => false])),
            Control::select('align_items', 'Horizontal alignment', ['stretch' => 'Stretch', 'flex-start' => 'Start', 'center' => 'Center', 'flex-end' => 'End'], $L(['responsive' => false])),
            Control::text('gap', 'Gap between elements', $L(['placeholder' => '16px'])),
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
