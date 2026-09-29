<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\CssBuilder;
use App\Landing\Builder\RenderContext;
use App\Landing\Builder\StyleCompiler;
use App\Landing\Support\Sanitizer;

/**
 * A banner/gallery that slides through a list of images (hero carousels, "as seen in" strips,
 * before/after shots...). Reuses the exact same runtime hooks as the Testimonial Slider
 * (data-lp-slider / data-ts-track / data-ts-prev / data-ts-next / data-ts-dot in tracker.js),
 * so no JS changes are needed to support it - it's the same generic slider behaviour.
 */
class ImageSliderElement extends AbstractElement
{
    public function type(): string
    {
        return 'image_slider';
    }

    public function label(): string
    {
        return 'Image Slider';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => [
                'images' => [
                    ['image' => '', 'alt' => 'Slide 1', 'link' => ''],
                    ['image' => '', 'alt' => 'Slide 2', 'link' => ''],
                    ['image' => '', 'alt' => 'Slide 3', 'link' => ''],
                ],
                'fit' => 'cover',
                'autoplay' => true,
                'interval' => 4,
                'arrows' => true,
                'dots' => true,
            ],
            'settings' => [
                'border_radius' => '16px', 'box_shadow' => 'none',
                'height' => ['desktop' => '420px', 'tablet' => '320px', 'mobile' => '220px'],
            ],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        $item = [
            Control::image('image', 'Image'),
            Control::text('alt', 'Alt text'),
            Control::url('link', 'Link (optional)'),
        ];

        return [
            Control::repeater('images', 'Slides', $item, ['image' => '', 'alt' => 'New slide', 'link' => ''], ['title_field' => 'alt', 'section' => 'Slides']),
            Control::select('fit', 'Image fit', ['cover' => 'Fill (crop to box)', 'contain' => 'Fit (show whole image)'], ['default' => 'cover', 'section' => 'Behaviour']),
            Control::switch('arrows', 'Show arrows', ['default' => true, 'section' => 'Behaviour']),
            Control::switch('dots', 'Show dots', ['default' => true, 'section' => 'Behaviour']),
            Control::switch('autoplay', 'Auto-play', ['default' => true, 'section' => 'Behaviour']),
            Control::number('interval', 'Auto-play interval (seconds)', ['min' => 2, 'max' => 30, 'default' => 4, 'if' => ['autoplay' => [true]], 'section' => 'Behaviour']),
        ];
    }

    protected function styleControls(): array
    {
        return [Control::text('height', 'Slide height', ['tab' => 'style', 'section' => 'Image slider', 'responsive' => true, 'placeholder' => '420px'])];
    }

    protected function styleGroups(): array
    {
        return ['border', 'effects', 'size'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $css = new CssBuilder;
        $css->raw($root.' .lp-is-viewport{overflow:hidden;position:relative;width:100%}'
            .$root.'.lp-ts-no-js .lp-is-viewport{overflow-x:auto;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory}'
            .$root.' .lp-is-viewport::-webkit-scrollbar{display:none}'
            .$root.' .lp-is-track{display:flex;will-change:transform;height:100%}'
            .$root.'.lp-ts-no-js .lp-is-track{transition:none}'
            .$root.' .lp-is-slide{flex:0 0 100%;min-width:0;scroll-snap-align:start;height:100%}'
            .$root.' .lp-is-slide a,'.$root.' .lp-is-slide img{display:block;width:100%;height:100%}'
            .$root.' .lp-is-slide img{object-fit:'.($this->c($node, 'fit', 'cover') === 'contain' ? 'contain' : 'cover').';background:#f1f5f9}'
            .$root.' .lp-ts-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:36px;height:36px;border-radius:50%;border:none;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;color:#111827}'
            .$root.' .lp-ts-prev{left:12px}'.$root.' .lp-ts-next{right:12px}'
            .$root.' .lp-ts-dots{position:absolute;left:0;right:0;bottom:12px;z-index:2;display:flex;justify-content:center;gap:8px}'
            .$root.' .lp-ts-dot{width:8px;height:8px;border-radius:50%;border:none;padding:0;background:rgba(255,255,255,.55);cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,.15)}'
            .$root.' .lp-ts-dot.is-active{background:#fff;width:20px;border-radius:4px}');

        $height = array_map(fn ($v) => $v === null ? null : Sanitizer::length($v), StyleCompiler::resolve($node['settings']['height'] ?? null));
        if ($height['mobile'] !== null || $height['tablet'] !== null || $height['desktop'] !== null) {
            $css->add($root.' .lp-is-viewport, '.$root.' .lp-is-slide', 'height', $height);
        }

        return $css->toString();
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $images = array_values(array_filter((array) $this->c($node, 'images', []), fn ($it) => is_array($it) && (($it['image'] ?? '') !== '')));
        if (! $images) {
            return $ctx->editing ? $this->open($node, $ctx).'<div class="lp-placeholder">Add images in the Content tab.</div></div>' : '';
        }

        $slide = function (array $item): string {
            $src = Sanitizer::url((string) ($item['image'] ?? ''), ['http', 'https']);
            if ($src === '') {
                return '';
            }
            $alt = e((string) ($item['alt'] ?? ''));
            $img = '<img src="'.e($src).'" alt="'.$alt.'" loading="lazy">';
            $link = Sanitizer::url((string) ($item['link'] ?? ''));

            return '<div class="lp-is-slide">'.($link !== '' ? '<a href="'.e($link).'">'.$img.'</a>' : $img).'</div>';
        };

        $slides = implode('', array_filter(array_map($slide, $images)));
        if ($slides === '') {
            return $ctx->editing ? $this->open($node, $ctx).'<div class="lp-placeholder">Add images in the Content tab.</div></div>' : '';
        }

        $count = count($images);
        $arrows = $this->c($node, 'arrows', true) && $count > 1
            ? '<button type="button" class="lp-ts-arrow lp-ts-prev" data-ts-prev aria-label="Previous slide">&#8249;</button>'
              .'<button type="button" class="lp-ts-arrow lp-ts-next" data-ts-next aria-label="Next slide">&#8250;</button>'
            : '';

        $dots = '';
        if ($this->c($node, 'dots', true) && $count > 1) {
            $dots = '<div class="lp-ts-dots" data-ts-dots>';
            for ($i = 0; $i < $count; $i++) {
                $dots .= '<button type="button" class="lp-ts-dot'.($i === 0 ? ' is-active' : '').'" data-ts-dot="'.$i.'" aria-label="Go to slide '.($i + 1).'"></button>';
            }
            $dots .= '</div>';
        }

        $autoplay = $this->c($node, 'autoplay', true) && $count > 1;
        $interval = max(2, min(30, (int) $this->c($node, 'interval', 4))) * 1000;
        $attrs = ['data-lp-slider' => '', 'data-ts-autoplay' => $autoplay ? '1' : '0', 'data-ts-interval' => (string) $interval];

        return $this->open($node, $ctx, 'div', ['lp-ts-no-js'], $attrs)
            .'<div class="lp-is-viewport"><div class="lp-is-track" data-ts-track>'.$slides.'</div></div>'
            .$arrows.$dots.'</div>';
    }
}
