<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Icons;

class CallElement extends AbstractElement
{
    public function type(): string
    {
        return 'call';
    }

    public function label(): string
    {
        return 'Call Button';
    }

    public function category(): string
    {
        return 'marketing';
    }

    public function defaults(): array
    {
        return [
            'content' => ['text' => 'Call Us Now', 'number' => '', 'event_enabled' => true, 'event_name' => 'Contact', 'event_browser' => true, 'event_server' => true],
            'settings' => ['align' => ['desktop' => 'left'], 'background_type' => 'color', 'background_color' => '#0f172a', 'color' => '#ffffff', 'border_radius' => '8px', 'font_weight' => '600'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return array_merge([
            Control::text('text', 'Button text', ['default' => 'Call Us Now']),
            Control::text('number', 'Phone number', ['placeholder' => '+15551234567']),
        ], $this->trackingControls('Contact'));
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects'];
    }

    public function skinSelector(string $root): string
    {
        return $root.' .lp-btn';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $num = preg_replace('/[^0-9+]/', '', (string) $this->c($node, 'number', ''));
        $attrs = ['class' => 'lp-btn lp-btn-md', 'href' => $num !== '' ? 'tel:'.$num : '#'] + $this->trackAttrs($node, $ctx, 'click');

        return $this->open($node, $ctx).'<a'.$this->attrs($attrs).'>'.Icons::svg('phone').'<span>'.e((string) $this->c($node, 'text', 'Call')).'</span></a></div>';
    }
}
