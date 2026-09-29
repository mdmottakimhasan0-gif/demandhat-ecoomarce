<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

/**
 * A row of testimonials that slides one-at-a-time (or several, on desktop). Works without JS
 * as a swipeable, scroll-snapped strip; the runtime script (tracker.js) layers on arrows,
 * dots and auto-play for browsers that run it.
 */
class TestimonialSliderElement extends AbstractElement
{
    public function type(): string
    {
        return 'testimonial_slider';
    }

    public function label(): string
    {
        return 'Testimonial Slider';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        $item = ['quote' => '', 'name' => '', 'role' => '', 'avatar' => '', 'rating' => 5];

        return [
            'content' => [
                'items' => [
                    ['quote' => 'Exactly as described and delivered fast. Very happy with it.', 'name' => 'Jane Cooper', 'role' => 'Verified buyer', 'avatar' => '', 'rating' => 5],
                    ['quote' => 'Great quality for the price. Packaging was perfect and support was helpful.', 'name' => 'Alex Kim', 'role' => 'Verified buyer', 'avatar' => '', 'rating' => 5],
                    ['quote' => 'Ordering was easy and cash on delivery made it risk-free. Recommended!', 'name' => 'Priya N.', 'role' => 'Verified buyer', 'avatar' => '', 'rating' => 5],
                ],
                'autoplay' => true,
                'interval' => 5,
                'arrows' => true,
                'dots' => true,
                'slides_desktop' => '1',
            ],
            'settings' => [
                'background_type' => 'color', 'background_color' => '#f8fafc', 'border_radius' => '16px',
                'padding' => ['desktop' => ['top' => '32px', 'right' => '56px', 'bottom' => '32px', 'left' => '56px'], 'mobile' => ['top' => '20px', 'right' => '40px', 'bottom' => '20px', 'left' => '40px']],
                'max_width' => '760px',
                'margin' => ['desktop' => ['left' => 'auto', 'right' => 'auto']],
            ],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        $item = [
            Control::textarea('quote', 'Quote', ['rows' => 3]),
            Control::text('name', 'Name'),
            Control::text('role', 'Role / company'),
            Control::image('avatar', 'Avatar'),
            Control::number('rating', 'Rating (0-5)', ['min' => 0, 'max' => 5]),
        ];

        return [
            Control::repeater('items', 'Testimonials', $item, ['quote' => 'Great experience overall.', 'name' => 'New reviewer', 'role' => '', 'avatar' => '', 'rating' => 5], ['title_field' => 'name', 'section' => 'Testimonials']),
            Control::select('slides_desktop', 'Visible at once (desktop)', ['1' => '1', '2' => '2', '3' => '3'], ['default' => '1', 'section' => 'Behaviour']),
            Control::switch('arrows', 'Show arrows', ['default' => true, 'section' => 'Behaviour']),
            Control::switch('dots', 'Show dots', ['default' => true, 'section' => 'Behaviour']),
            Control::switch('autoplay', 'Auto-play', ['default' => true, 'section' => 'Behaviour']),
            Control::number('interval', 'Auto-play interval (seconds)', ['min' => 2, 'max' => 30, 'default' => 5, 'if' => ['autoplay' => [true]], 'section' => 'Behaviour']),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects', 'size'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $desktopN = max(1, min(3, (int) ($node['content']['slides_desktop'] ?? 1)));

        $css = $root.' .lp-ts-viewport{overflow:hidden;position:relative}'
            .$root.'.lp-ts-no-js .lp-ts-viewport{overflow-x:auto;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory}'
            .$root.' .lp-ts-viewport::-webkit-scrollbar{display:none}'
            .$root.' .lp-ts-track{display:flex;will-change:transform}'
            .$root.'.lp-ts-no-js .lp-ts-track{transition:none}'
            .$root.' .lp-ts-slide{flex:0 0 100%;min-width:0;scroll-snap-align:start;padding:0 8px;box-sizing:border-box}'
            .$root.' .lp-ts-card{height:100%}'
            .$root.' .lp-t-stars{color:#f59e0b;letter-spacing:2px;margin-bottom:8px}'
            .$root.' blockquote{margin:0 0 16px}'
            .$root.' .lp-t-who{display:flex;align-items:center;gap:12px}'
            .$root.' .lp-t-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;flex:none}'
            .$root.' .lp-t-name{font-weight:700}'
            .$root.' .lp-t-role{opacity:.7;font-size:.9em}'
            .$root.' .lp-ts-arrow{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:36px;height:36px;border-radius:50%;border:none;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.15);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;color:#111827}'
            .$root.' .lp-ts-prev{left:-4px}'.$root.' .lp-ts-next{right:-4px}'
            .$root.' .lp-ts-dots{display:flex;justify-content:center;gap:8px;margin-top:16px}'
            .$root.' .lp-ts-dot{width:8px;height:8px;border-radius:50%;border:none;padding:0;background:rgba(0,0,0,.2);cursor:pointer}'
            .$root.' .lp-ts-dot.is-active{background:#111827;width:20px;border-radius:4px}';

        if ($desktopN > 1) {
            $css .= '@media(min-width:1025px){'.$root.' .lp-ts-slide{flex:0 0 '.round(100 / $desktopN, 4).'%}}';
        }

        return $css;
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $items = array_values((array) $this->c($node, 'items', []));
        if (! $items) {
            return $ctx->editing ? $this->open($node, $ctx).'<div class="lp-placeholder">Add testimonials in the Content tab.</div></div>' : '';
        }

        $slide = function (array $item): string {
            $rating = max(0, min(5, (int) ($item['rating'] ?? 0)));
            $stars = $rating > 0 ? '<div class="lp-t-stars" aria-label="'.$rating.' out of 5">'.str_repeat('★', $rating).str_repeat('☆', 5 - $rating).'</div>' : '';
            $avatar = Sanitizer::url((string) ($item['avatar'] ?? ''), ['http', 'https']);

            return '<div class="lp-ts-slide"><div class="lp-ts-card">'.$stars
                .'<blockquote>'.nl2br(e((string) ($item['quote'] ?? ''))).'</blockquote>'
                .'<div class="lp-t-who">'.($avatar !== '' ? '<img class="lp-t-avatar" src="'.e($avatar).'" alt="" loading="lazy" width="48" height="48">' : '')
                .'<div><div class="lp-t-name">'.e((string) ($item['name'] ?? '')).'</div><div class="lp-t-role">'.e((string) ($item['role'] ?? '')).'</div></div></div>'
                .'</div></div>';
        };

        $slides = implode('', array_map($slide, $items));

        $arrows = $this->c($node, 'arrows', true) && count($items) > 1
            ? '<button type="button" class="lp-ts-arrow lp-ts-prev" data-ts-prev aria-label="Previous testimonial">&#8249;</button>'
              .'<button type="button" class="lp-ts-arrow lp-ts-next" data-ts-next aria-label="Next testimonial">&#8250;</button>'
            : '';

        $dots = '';
        if ($this->c($node, 'dots', true) && count($items) > 1) {
            $dots = '<div class="lp-ts-dots" data-ts-dots>';
            foreach ($items as $i => $_) {
                $dots .= '<button type="button" class="lp-ts-dot'.($i === 0 ? ' is-active' : '').'" data-ts-dot="'.$i.'" aria-label="Go to testimonial '.($i + 1).'"></button>';
            }
            $dots .= '</div>';
        }

        $autoplay = $this->c($node, 'autoplay', true) && count($items) > 1;
        $interval = max(2, min(30, (int) $this->c($node, 'interval', 5))) * 1000;

        $attrs = ['data-lp-slider' => '', 'data-ts-autoplay' => $autoplay ? '1' : '0', 'data-ts-interval' => (string) $interval];

        return $this->open($node, $ctx, 'div', ['lp-ts-no-js'], $attrs)
            .'<div class="lp-ts-viewport"><div class="lp-ts-track" data-ts-track>'.$slides.'</div></div>'
            .$arrows.$dots.'</div>';
    }
}
