<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Icons;
use App\Landing\Support\Sanitizer;

class FeatureListElement extends AbstractElement
{
    public function type(): string
    {
        return 'feature_list';
    }

    public function label(): string
    {
        return 'Feature List';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => ['items' => [
                ['icon' => 'check-circle', 'text' => 'Done-for-you setup'],
                ['icon' => 'check-circle', 'text' => 'Results in 30 days'],
                ['icon' => 'check-circle', 'text' => 'Dedicated support'],
            ]],
            'settings' => ['icon_color' => '#16a34a', 'font_size' => '18px'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [Control::repeater('items', 'Items', [
            Control::icon('icon', 'Icon', ['default' => 'check-circle']),
            Control::text('text', 'Text'),
        ], ['icon' => 'check-circle', 'text' => 'New feature'], ['title_field' => 'text'])];
    }

    protected function styleControls(): array
    {
        return [
            Control::color('icon_color', 'Icon color', ['tab' => 'style', 'section' => 'Icon']),
            Control::text('grid_gap', 'Item spacing', ['tab' => 'style', 'section' => 'Icon', 'placeholder' => '12px', 'responsive' => true]),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'effects'];
    }

    public function innerSelector(string $root): ?string
    {
        return $root.' ul';
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        // align-items:center (not flex-start + a fixed margin-top "eyeball" offset) is what
        // keeps the icon level with the text across different fonts/sizes/line-heights - the
        // old fixed offset was tuned for one font and drifted out of line on others (e.g. the
        // taller line-height of Bengali text). Multi-line items centre the icon against the
        // whole wrapped block, which reads fine for short feature/spec lines.
        $css = $root.' ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}'
            .$root.' li{display:flex;gap:10px;align-items:center}'.$root.' .lp-icon{flex:none;color:var(--lp-fl-icon,currentColor)}';
        if ($c = Sanitizer::color($node['settings']['icon_color'] ?? '')) {
            $css .= $root.'{--lp-fl-icon:'.$c.'}';
        }

        return $css;
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $items = '';
        foreach ((array) $this->c($node, 'items', []) as $item) {
            $items .= '<li>'.Icons::svg($item['icon'] ?? 'check-circle').'<span>'.e((string) ($item['text'] ?? '')).'</span></li>';
        }

        return $this->open($node, $ctx).'<ul>'.$items.'</ul></div>';
    }
}
