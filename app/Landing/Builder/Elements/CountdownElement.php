<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use Carbon\Carbon;

class CountdownElement extends AbstractElement
{
    public function type(): string
    {
        return 'countdown';
    }

    public function label(): string
    {
        return 'Countdown';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => [
                'target' => Carbon::now()->addDays(7)->format('Y-m-d\TH:i'), 'expired_text' => 'This offer has ended.',
                'show_days' => true, 'show_hours' => true, 'show_minutes' => true, 'show_seconds' => true,
                'label_days' => 'Days', 'label_hours' => 'Hours', 'label_minutes' => 'Minutes', 'label_seconds' => 'Seconds',
            ],
            'settings' => ['align' => 'center', 'font_size' => ['desktop' => '40px', 'mobile' => '26px'], 'font_weight' => '800'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        $unit = fn (string $key, string $label, string $default) => [
            Control::switch('show_'.$key, 'Show '.$label, ['default' => true, 'section' => $label]),
            Control::text('label_'.$key, $label.' label', ['default' => $default, 'section' => $label, 'if' => ['show_'.$key => [true]]]),
        ];

        return [
            Control::datetime('target', 'Ends at (UTC)'),
            Control::text('expired_text', 'Text when finished'),
            ...$unit('days', 'Days', 'Days'),
            ...$unit('hours', 'Hours', 'Hours'),
            ...$unit('minutes', 'Minutes', 'Minutes'),
            ...$unit('seconds', 'Seconds', 'Seconds'),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        // Mobile-first: tighter gap/min-width/padding by default so up to 4 units stay on one line
        // even on a narrow phone; widens back out from tablet up. Hiding a unit (below) helps too.
        return $root.' .lp-cd{display:inline-flex;gap:6px;flex-wrap:wrap;justify-content:center}'
            .$root.' .lp-cd-unit{min-width:52px;padding:6px 4px;text-align:center}'
            .$root.' .lp-cd-num{display:block;font-variant-numeric:tabular-nums;line-height:1.1}'
            .$root.' .lp-cd-label{display:block;font-size:10px;font-weight:500;text-transform:uppercase;letter-spacing:.06em;opacity:.7}'
            .'@media(min-width:768px){'.$root.' .lp-cd{gap:16px}'.$root.' .lp-cd-unit{min-width:80px;padding:12px 8px}'.$root.' .lp-cd-label{font-size:12px;letter-spacing:.08em}}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $ctx->hasCountdown = true;
        $ts = strtotime((string) $this->c($node, 'target', ''));
        $iso = $ts ? gmdate('Y-m-d\TH:i:s\Z', $ts) : '';

        $unit = fn ($key, $default) => '<div class="lp-cd-unit"><span class="lp-cd-num" data-cd="'.$key.'">00</span><span class="lp-cd-label">'
            .e((string) $this->c($node, 'label_'.$key, $default)).'</span></div>';

        $units = '';
        foreach (['days' => 'Days', 'hours' => 'Hours', 'minutes' => 'Minutes', 'seconds' => 'Seconds'] as $key => $default) {
            if ($this->c($node, 'show_'.$key, true)) {
                $units .= $unit($key, $default);
            }
        }
        if ($units === '') {
            $units = $unit('seconds', 'Seconds'); // never render an empty, useless countdown
        }

        return $this->open($node, $ctx, 'div', [], ['data-lp-countdown' => $iso, 'data-expired' => (string) $this->c($node, 'expired_text', '')])
            .'<div class="lp-cd">'.$units.'</div></div>';
    }
}
