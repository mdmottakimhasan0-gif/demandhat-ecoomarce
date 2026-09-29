<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Icons;

class WhatsappElement extends AbstractElement
{
    public function type(): string
    {
        return 'whatsapp';
    }

    public function label(): string
    {
        return 'WhatsApp Button';
    }

    public function category(): string
    {
        return 'marketing';
    }

    public function defaults(): array
    {
        return [
            'content' => ['text' => 'Chat on WhatsApp', 'number' => '', 'message' => 'Hi! I am interested in your offer.', 'floating' => false, 'event_enabled' => true, 'event_name' => 'Contact', 'event_browser' => true, 'event_server' => true],
            'settings' => ['align' => ['desktop' => 'left'], 'background_type' => 'color', 'background_color' => '#25d366', 'color' => '#ffffff', 'border_radius' => '999px', 'font_weight' => '600'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return array_merge([
            Control::text('text', 'Button text', ['default' => 'Chat on WhatsApp']),
            Control::text('number', 'WhatsApp number', ['placeholder' => '15551234567', 'help' => 'International format, digits only']),
            Control::textarea('message', 'Prefilled message', ['rows' => 2]),
            Control::switch('floating', 'Floating button (bottom right)'),
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

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $this->c($node, 'floating') && ! $ctx->editing
            ? $root.'{position:fixed;right:20px;bottom:20px;z-index:50;margin:0}'
            : '';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $digits = preg_replace('/\D/', '', (string) $this->c($node, 'number', ''));
        $url = $digits !== '' ? 'https://wa.me/'.substr($digits, 0, 20).'?text='.rawurlencode((string) $this->c($node, 'message', '')) : '#';
        $attrs = ['class' => 'lp-btn lp-btn-md', 'href' => $url, 'target' => '_blank', 'rel' => 'noopener noreferrer'] + $this->trackAttrs($node, $ctx, 'click');

        return $this->open($node, $ctx).'<a'.$this->attrs($attrs).'>'.Icons::svg('whatsapp').'<span>'.e((string) $this->c($node, 'text', 'WhatsApp')).'</span></a></div>';
    }
}
