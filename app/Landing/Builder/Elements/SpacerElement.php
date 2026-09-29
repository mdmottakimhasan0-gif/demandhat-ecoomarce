<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;

class SpacerElement extends AbstractElement
{
    public function type(): string
    {
        return 'spacer';
    }

    public function label(): string
    {
        return 'Spacer';
    }

    public function category(): string
    {
        return 'basic';
    }

    public function defaults(): array
    {
        return ['content' => [], 'settings' => ['height' => ['desktop' => '48px', 'mobile' => '24px']], 'children' => []];
    }

    protected function contentControls(): array
    {
        return [Control::text('height', 'Height', ['tab' => 'content', 'store' => 'settings', 'responsive' => true, 'placeholder' => '48px'])];
    }

    protected function styleGroups(): array
    {
        return [];
    }

    protected function advancedGroups(): array
    {
        return ['visibility', 'attributes'];
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        return $this->open($node, $ctx, 'div', [], ['aria-hidden' => 'true']).'</div>';
    }
}
