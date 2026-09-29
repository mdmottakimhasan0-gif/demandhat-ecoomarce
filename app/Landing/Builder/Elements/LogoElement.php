<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

/** "Logo" strip: a row of client / partner logos. */
class LogoElement extends AbstractElement
{
    public function type(): string
    {
        return 'logo';
    }

    public function label(): string
    {
        return 'Logo Strip';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => ['logos' => [['image' => '', 'alt' => 'Client 1', 'url' => ''], ['image' => '', 'alt' => 'Client 2', 'url' => ''], ['image' => '', 'alt' => 'Client 3', 'url' => ''], ['image' => '', 'alt' => 'Client 4', 'url' => '']], 'grayscale' => true],
            'settings' => ['columns' => ['desktop' => 4, 'tablet' => 3, 'mobile' => 2], 'grid_gap' => '24px'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [
            Control::repeater('logos', 'Logos', [
                Control::image('image', 'Logo'),
                Control::text('alt', 'Name / alt'),
                Control::url('url', 'Link'),
            ], ['image' => '', 'alt' => 'Logo', 'url' => ''], ['title_field' => 'alt']),
            Control::switch('grayscale', 'Grayscale', ['default' => true]),
            $this->columnsControl(),
        ];
    }

    protected function styleGroups(): array
    {
        return ['effects'];
    }

    protected function styleControls(): array
    {
        return [
            Control::text('grid_gap', 'Gap', ['tab' => 'style', 'section' => 'Layout', 'responsive' => true, 'placeholder' => '24px']),
            Control::text('logo_height', 'Logo max height', ['tab' => 'style', 'section' => 'Layout', 'placeholder' => '48px']),
        ];
    }

    public function innerSelector(string $root): ?string
    {
        return $root.' .lp-logo-grid';
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $h = Sanitizer::length($node['settings']['logo_height'] ?? '') ?? '48px';
        $gray = $this->c($node, 'grayscale', true) ? 'filter:grayscale(1);opacity:.7;' : '';

        return $root.' .lp-logo-grid{display:grid;align-items:center}'
            .$this->gridCss($node, $root.' .lp-logo-grid', ['desktop' => 4, 'tablet' => 3, 'mobile' => 2])
            .$root.' .lp-logo-item{display:flex;justify-content:center;align-items:center;min-height:'.$h.'}'
            .$root.' .lp-logo-item img{max-height:'.$h.';max-width:100%;width:auto;height:auto;'.$gray.'}'
            .$root.' .lp-logo-name{font-weight:700;opacity:.55}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $items = '';
        foreach ((array) $this->c($node, 'logos', []) as $l) {
            $src = Sanitizer::url($l['image'] ?? '', ['http', 'https']);
            $inner = $src !== '' ? '<img src="'.e($src).'" alt="'.e((string) ($l['alt'] ?? '')).'" loading="lazy" decoding="async">'
                : '<span class="lp-logo-name">'.e((string) ($l['alt'] ?? '')).'</span>';
            $href = Sanitizer::url($l['url'] ?? '');
            if ($href !== '' && ! $ctx->editing) {
                $inner = '<a href="'.e($href).'" rel="noopener">'.$inner.'</a>';
            }
            $items .= '<div class="lp-logo-item">'.$inner.'</div>';
        }

        return $this->open($node, $ctx).'<div class="lp-logo-grid">'.$items.'</div></div>';
    }
}
