<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

/** Call-to-action block: heading + text + button in one styled box. */
class CtaElement extends AbstractElement
{
    public function type(): string
    {
        return 'cta';
    }

    public function label(): string
    {
        return 'Call to Action';
    }

    public function category(): string
    {
        return 'marketing';
    }

    public function defaults(): array
    {
        return [
            'content' => ['title' => 'Ready to get started?', 'description' => 'Book your free consultation today - no obligation.', 'button_text' => 'Book Consultation', 'button_url' => '#form', 'event_enabled' => true, 'event_name' => 'Lead', 'event_browser' => true, 'event_server' => true],
            'settings' => [
                'align' => 'center', 'background_type' => 'gradient', 'gradient_from' => '#2563eb', 'gradient_to' => '#7c3aed', 'gradient_angle' => 135,
                'color' => '#ffffff', 'border_radius' => '20px',
                'padding' => ['desktop' => ['top' => '56px', 'right' => '32px', 'bottom' => '56px', 'left' => '32px'], 'mobile' => ['top' => '36px', 'right' => '20px', 'bottom' => '36px', 'left' => '20px']],
            ],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return array_merge([
            Control::text('title', 'Title'),
            Control::textarea('description', 'Description', ['rows' => 3]),
            Control::text('button_text', 'Button text'),
            Control::url('button_url', 'Button link'),
        ], $this->trackingControls('Lead'));
    }

    protected function styleControls(): array
    {
        $S = fn (array $o = []) => $o + ['tab' => 'style', 'section' => 'Button'];

        return [
            Control::color('button_background', 'Button background', $S()),
            Control::color('button_color', 'Button text color', $S()),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $bg = Sanitizer::color($node['settings']['button_background'] ?? '') ?? '#ffffff';
        $fg = Sanitizer::color($node['settings']['button_color'] ?? '') ?? '#111827';

        return $root.' .lp-cta-title{margin:0 0 10px;font-size:2em;line-height:1.2}'.$root.' .lp-cta-desc{margin:0 0 24px;opacity:.9;font-size:1.1em}'
            .$root.' .lp-btn{background:'.$bg.';color:'.$fg.'}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $url = Sanitizer::url($this->c($node, 'button_url', '#')) ?: '#';
        $attrs = ['class' => 'lp-btn lp-btn-lg', 'href' => $url] + $this->trackAttrs($node, $ctx, 'click');

        return $this->open($node, $ctx)
            .'<h2 class="lp-cta-title">'.e((string) $this->c($node, 'title', '')).'</h2>'
            .'<p class="lp-cta-desc">'.nl2br(e((string) $this->c($node, 'description', ''))).'</p>'
            .'<a'.$this->attrs($attrs).'><span>'.e((string) $this->c($node, 'button_text', 'Get started')).'</span></a></div>';
    }
}
