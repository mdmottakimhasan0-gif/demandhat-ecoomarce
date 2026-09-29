<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class ImageBoxElement extends AbstractElement
{
    public function type(): string
    {
        return 'image_box';
    }

    public function label(): string
    {
        return 'Image Box';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => ['image' => '', 'alt' => '', 'title' => 'Box Title', 'description' => 'Short description for this box.', 'tag' => 'h3'],
            'settings' => ['align' => 'center', 'border_radius' => '12px', 'box_shadow' => 'sm'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [
            Control::image('image', 'Image'),
            Control::text('alt', 'Alt text'),
            Control::text('title', 'Title'),
            Control::textarea('description', 'Description', ['rows' => 3]),
            Control::select('tag', 'Title tag', ['h2' => 'H2', 'h3' => 'H3', 'h4' => 'H4', 'div' => 'div'], ['default' => 'h3']),
            Control::url('link', 'Link'),
        ];
    }

    protected function styleGroups(): array
    {
        return ['background', 'border', 'effects', 'typography', 'color'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $root.'{overflow:hidden}'.$root.' .lp-imgbox-img{display:block;width:100%;height:auto}'.$root.' .lp-imgbox-body{padding:20px}'
            .$root.' .lp-imgbox-title{margin:0 0 8px;font-size:1.2em}'.$root.' .lp-imgbox-desc{margin:0}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $src = Sanitizer::url($this->c($node, 'image', ''), ['http', 'https']);
        $tag = $this->tag($this->c($node, 'tag', 'h3'), ['h2', 'h3', 'h4', 'div'], 'h3');
        $img = $src !== '' ? '<img class="lp-imgbox-img" src="'.e($src).'" alt="'.e((string) $this->c($node, 'alt', '')).'" loading="lazy" decoding="async">'
            : ($ctx->editing ? '<div class="lp-placeholder">Select an image</div>' : '');
        $title = e((string) $this->c($node, 'title', ''));
        $link = Sanitizer::url($this->c($node, 'link', ''));
        if ($link !== '' && $title !== '') {
            $title = '<a href="'.e($link).'" style="color:inherit;text-decoration:none">'.$title.'</a>';
        }

        return $this->open($node, $ctx).$img.'<div class="lp-imgbox-body">'
            .($title !== '' ? '<'.$tag.' class="lp-imgbox-title">'.$title.'</'.$tag.'>' : '')
            .'<p class="lp-imgbox-desc">'.nl2br(e((string) $this->c($node, 'description', ''))).'</p></div></div>';
    }
}
