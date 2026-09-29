<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Icons;
use App\Landing\Support\Sanitizer;

class IconElement extends AbstractElement
{
    public function type(): string
    {
        return 'icon';
    }

    public function label(): string
    {
        return 'Icon';
    }

    public function category(): string
    {
        return 'basic';
    }

    public function defaults(): array
    {
        return ['content' => ['icon' => 'star'], 'settings' => ['align' => 'center', 'font_size' => '48px', 'color' => '#2563eb'], 'children' => []];
    }

    protected function contentControls(): array
    {
        return [
            Control::icon('icon', 'Icon', ['default' => 'star']),
            Control::url('link', 'Link'),
        ];
    }

    protected function styleGroups(): array
    {
        return ['color', 'effects'];
    }

    protected function styleControls(): array
    {
        return [Control::text('font_size', 'Size', ['tab' => 'style', 'section' => 'Icon', 'responsive' => true, 'placeholder' => '48px'])];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $root.' .lp-icon{display:inline-block;vertical-align:middle}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $svg = Icons::svg($this->c($node, 'icon', 'star'));
        $link = Sanitizer::url($this->c($node, 'link', ''));
        if ($link !== '' && ! $ctx->editing) {
            $svg = '<a href="'.e($link).'" aria-label="icon link">'.$svg.'</a>';
        }

        return $this->open($node, $ctx).$svg.'</div>';
    }
}
