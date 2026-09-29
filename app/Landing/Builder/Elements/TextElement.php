<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class TextElement extends AbstractElement
{
    public function type(): string
    {
        return 'text';
    }

    public function label(): string
    {
        return 'Text Editor';
    }

    public function category(): string
    {
        return 'basic';
    }

    public function defaults(): array
    {
        return [
            'content' => ['html' => '<p>Click here to edit this text. Explain the value of your offer in a few clear sentences.</p>'],
            'settings' => ['font_size' => ['desktop' => '18px', 'mobile' => '16px'], 'line_height' => '1.7'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [Control::richtext('html', 'Text')];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'effects'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $ctx->useFont($node['settings']['font_family'] ?? null);

        return $root.'>:first-child{margin-top:0}'.$root.'>:last-child{margin-bottom:0}'.$root.' ul,'.$root.' ol{padding-left:1.4em}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        return $this->open($node, $ctx).Sanitizer::html((string) $this->c($node, 'html', ''), 'rich').'</div>';
    }
}
