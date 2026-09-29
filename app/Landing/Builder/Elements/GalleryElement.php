<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class GalleryElement extends AbstractElement
{
    public function type(): string
    {
        return 'gallery';
    }

    public function label(): string
    {
        return 'Gallery';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => ['images' => [['image' => '', 'alt' => ''], ['image' => '', 'alt' => ''], ['image' => '', 'alt' => '']]],
            'settings' => ['columns' => ['desktop' => 3, 'tablet' => 2, 'mobile' => 1], 'grid_gap' => '12px', 'border_radius' => '10px'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [
            Control::repeater('images', 'Images', [
                Control::image('image', 'Image'),
                Control::text('alt', 'Alt text'),
            ], ['image' => '', 'alt' => ''], ['title_field' => 'alt']),
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
            Control::text('grid_gap', 'Gap', ['tab' => 'style', 'section' => 'Layout', 'responsive' => true, 'placeholder' => '12px']),
            Control::dimensions('border_radius', 'Image radius', ['tab' => 'style', 'section' => 'Layout', 'responsive' => false]),
        ];
    }

    public function skinSelector(string $root): string
    {
        return $root.' .lp-gal-item img';
    }

    public function innerSelector(string $root): ?string
    {
        return $root.' .lp-gal-grid';
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $root.' .lp-gal-grid{display:grid}'.$this->gridCss($node, $root.' .lp-gal-grid')
            .$root.' .lp-gal-item{margin:0}'.$root.' .lp-gal-item img{display:block;width:100%;height:100%;aspect-ratio:4/3;object-fit:cover;background:#e5e7eb}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $items = '';
        foreach ((array) $this->c($node, 'images', []) as $img) {
            $src = Sanitizer::url($img['image'] ?? '', ['http', 'https']);
            $items .= '<figure class="lp-gal-item">'
                .($src !== '' ? '<img src="'.e($src).'" alt="'.e((string) ($img['alt'] ?? '')).'" loading="lazy" decoding="async">' : '<img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==">')
                .'</figure>';
        }

        return $this->open($node, $ctx).'<div class="lp-gal-grid">'.$items.'</div></div>';
    }
}
