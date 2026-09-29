<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class ImageElement extends AbstractElement
{
    public function type(): string
    {
        return 'image';
    }

    public function label(): string
    {
        return 'Image';
    }

    public function category(): string
    {
        return 'basic';
    }

    public function defaults(): array
    {
        return ['content' => ['image' => '', 'alt' => '', 'lazy' => true], 'settings' => ['align' => 'center'], 'children' => []];
    }

    protected function contentControls(): array
    {
        return [
            Control::image('image', 'Image'),
            Control::text('alt', 'Alt text'),
            Control::url('link', 'Link'),
            Control::select('link_target', 'Open link', ['_self' => 'Same tab', '_blank' => 'New tab'], ['default' => '_self']),
            Control::switch('lazy', 'Lazy load', ['default' => true]),
            Control::text('image_width', 'Intrinsic width (px)', ['help' => 'Set automatically by the media library']),
            Control::text('image_height', 'Intrinsic height (px)'),
        ];
    }

    protected function styleControls(): array
    {
        $S = fn (array $o = []) => $o + ['tab' => 'style', 'section' => 'Image'];

        return [
            Control::text('img_width', 'Width', $S(['responsive' => true, 'placeholder' => '100%'])),
            Control::text('img_max_width', 'Max width', $S(['responsive' => true, 'placeholder' => '600px'])),
            Control::text('height', 'Height', $S(['responsive' => true, 'placeholder' => 'auto'])),
            Control::select('object_fit', 'Object fit', ['' => 'Default', 'cover' => 'Cover', 'contain' => 'Contain', 'fill' => 'Fill'], $S()),
        ];
    }

    protected function styleGroups(): array
    {
        return ['border', 'effects'];
    }

    public function skinSelector(string $root): string
    {
        return $root.' img';
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $root.'{margin:0}'.$root.' img{max-width:100%;height:auto;display:inline-block;vertical-align:middle}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $src = Sanitizer::url($this->c($node, 'image', ''), ['http', 'https']);
        if ($src === '') {
            return $ctx->editing
                ? $this->open($node, $ctx, 'figure').'<div class="lp-placeholder">Select an image</div></figure>'
                : '';
        }
        $alt = (string) $this->c($node, 'alt', '');
        $w = preg_match('/^\d{1,4}$/', (string) $this->c($node, 'image_width', '')) ? $this->c($node, 'image_width') : null;
        $h = preg_match('/^\d{1,4}$/', (string) $this->c($node, 'image_height', '')) ? $this->c($node, 'image_height') : null;

        $img = '<img'.$this->attrs([
            'src' => $src, 'alt' => $alt, 'width' => $w, 'height' => $h,
            'loading' => ($this->c($node, 'lazy', true) && ! $ctx->editing) ? 'lazy' : null,
            'decoding' => 'async',
        ]).'>';

        $link = Sanitizer::url($this->c($node, 'link', ''));
        if ($link !== '' && ! $ctx->editing) {
            $blank = $this->c($node, 'link_target') === '_blank';
            $img = '<a href="'.e($link).'"'.($blank ? ' target="_blank" rel="noopener noreferrer"' : '').'>'.$img.'</a>';
        }

        return $this->open($node, $ctx, 'figure').$img.'</figure>';
    }
}
