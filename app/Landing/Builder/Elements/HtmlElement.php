<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

/** Safe HTML block: scripts, styles, iframes and event handlers are stripped. */
class HtmlElement extends AbstractElement
{
    public function type(): string
    {
        return 'html';
    }

    public function label(): string
    {
        return 'HTML';
    }

    public function category(): string
    {
        return 'advanced';
    }

    public function defaults(): array
    {
        return ['content' => ['html' => '<p>Custom <strong>HTML</strong> goes here.</p>'], 'settings' => [], 'children' => []];
    }

    protected function contentControls(): array
    {
        return [Control::code('html', 'HTML', ['language' => 'html', 'help' => 'Scripts and event handlers are removed for safety. Use Custom Code for scripts (admins only).'])];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects', 'size'];
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        return $this->open($node, $ctx).Sanitizer::html((string) $this->c($node, 'html', ''), 'html').'</div>';
    }
}
