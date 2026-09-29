<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Icons;
use App\Landing\Support\Sanitizer;

class PricingElement extends AbstractElement
{
    public function type(): string
    {
        return 'pricing';
    }

    public function label(): string
    {
        return 'Pricing';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => ['plans' => [
                ['name' => 'Starter', 'price' => '$49', 'period' => '/month', 'features' => "1 campaign\nEmail support", 'button_text' => 'Get Started', 'button_url' => '#form', 'highlight' => false, 'badge' => ''],
                ['name' => 'Growth', 'price' => '$99', 'period' => '/month', 'features' => "5 campaigns\nPriority support\nMonthly strategy call", 'button_text' => 'Get Started', 'button_url' => '#form', 'highlight' => true, 'badge' => 'Most popular'],
                ['name' => 'Scale', 'price' => '$199', 'period' => '/month', 'features' => "Unlimited campaigns\nDedicated manager", 'button_text' => 'Contact us', 'button_url' => '#form', 'highlight' => false, 'badge' => ''],
            ]],
            'settings' => ['columns' => ['desktop' => 3, 'tablet' => 2, 'mobile' => 1], 'grid_gap' => '24px'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return array_merge([
            Control::repeater('plans', 'Plans', [
                Control::text('name', 'Plan name'),
                Control::text('price', 'Price'),
                Control::text('period', 'Period'),
                Control::textarea('features', 'Features (one per line)', ['rows' => 4]),
                Control::text('button_text', 'Button text'),
                Control::url('button_url', 'Button link'),
                Control::switch('highlight', 'Highlight'),
                Control::text('badge', 'Badge'),
            ], ['name' => 'Plan', 'price' => '$0', 'period' => '/month', 'features' => '', 'button_text' => 'Choose', 'button_url' => '#', 'highlight' => false, 'badge' => ''], ['title_field' => 'name']),
            $this->columnsControl(),
        ], $this->trackingControls('InitiateCheckout'));
    }

    protected function styleControls(): array
    {
        return [
            Control::color('accent', 'Accent color', ['tab' => 'style', 'section' => 'Pricing']),
            Control::text('grid_gap', 'Gap', ['tab' => 'style', 'section' => 'Pricing', 'responsive' => true, 'placeholder' => '24px']),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'effects'];
    }

    public function innerSelector(string $root): ?string
    {
        return $root.' .lp-price-grid';
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $accent = Sanitizer::color($node['settings']['accent'] ?? '') ?? '#2563eb';

        return $root.'{--lp-accent:'.$accent.'}'.$root.' .lp-price-grid{display:grid;align-items:stretch}'
            .$this->gridCss($node, $root.' .lp-price-grid')
            .$root.' .lp-plan{position:relative;border:1px solid #e5e7eb;border-radius:16px;padding:28px;background:#fff;color:#111827;display:flex;flex-direction:column;gap:14px}'
            .$root.' .lp-plan.is-hl{border-color:var(--lp-accent);box-shadow:0 12px 32px rgba(0,0,0,.12)}'
            .$root.' .lp-plan-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--lp-accent);color:#fff;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px}'
            .$root.' .lp-plan-name{font-weight:700;font-size:1.1em}'.$root.' .lp-plan-price{font-size:2.4em;font-weight:800;line-height:1}'
            .$root.' .lp-plan-price small{font-size:.4em;font-weight:500;opacity:.7}'
            .$root.' .lp-plan ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px;flex:1}'
            .$root.' .lp-plan li{display:flex;gap:8px;align-items:flex-start}'.$root.' .lp-plan li .lp-icon{color:var(--lp-accent);margin-top:.25em;flex:none}'
            .$root.' .lp-plan-btn{display:block;text-align:center;padding:12px 20px;border-radius:10px;font-weight:600;text-decoration:none;background:var(--lp-accent);color:#fff}'
            .$root.' .lp-plan:not(.is-hl) .lp-plan-btn{background:transparent;color:var(--lp-accent);border:2px solid var(--lp-accent)}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $track = $this->trackAttrs($node, $ctx, 'click');
        $plans = '';
        foreach ((array) $this->c($node, 'plans', []) as $p) {
            $features = '';
            foreach (preg_split('/\r\n|\r|\n/', (string) ($p['features'] ?? '')) as $line) {
                if (trim($line) !== '') {
                    $features .= '<li>'.Icons::svg('check').'<span>'.e(trim($line)).'</span></li>';
                }
            }
            $url = Sanitizer::url($p['button_url'] ?? '#') ?: '#';
            $plans .= '<div class="lp-plan'.(! empty($p['highlight']) ? ' is-hl' : '').'">'
                .(! empty($p['badge']) ? '<span class="lp-plan-badge">'.e((string) $p['badge']).'</span>' : '')
                .'<div class="lp-plan-name">'.e((string) ($p['name'] ?? '')).'</div>'
                .'<div class="lp-plan-price">'.e((string) ($p['price'] ?? '')).'<small>'.e((string) ($p['period'] ?? '')).'</small></div>'
                .'<ul>'.$features.'</ul>'
                .'<a class="lp-plan-btn" href="'.e($url).'"'.$this->attrs($track).'>'.e((string) ($p['button_text'] ?? 'Choose')).'</a></div>';
        }

        return $this->open($node, $ctx).'<div class="lp-price-grid">'.$plans.'</div></div>';
    }
}
