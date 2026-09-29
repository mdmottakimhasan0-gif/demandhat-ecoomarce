<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class TestimonialElement extends AbstractElement
{
    public function type(): string
    {
        return 'testimonial';
    }

    public function label(): string
    {
        return 'Testimonial';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => ['quote' => 'This completely changed how we generate leads. We doubled our enquiries in the first month.', 'name' => 'Jane Cooper', 'role' => 'Marketing Director', 'avatar' => '', 'rating' => 5],
            'settings' => [
                'background_type' => 'color', 'background_color' => '#f8fafc',
                'border_radius' => '16px',
                'padding' => ['desktop' => ['top' => '28px', 'right' => '28px', 'bottom' => '28px', 'left' => '28px']],
            ],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [
            Control::textarea('quote', 'Quote', ['rows' => 4]),
            Control::text('name', 'Name'),
            Control::text('role', 'Role / company'),
            Control::image('avatar', 'Avatar'),
            Control::number('rating', 'Rating (0-5)', ['min' => 0, 'max' => 5]),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $root.' .lp-t-stars{color:#f59e0b;letter-spacing:2px;margin-bottom:8px}'.$root.' blockquote{margin:0 0 16px}'
            .$root.' .lp-t-who{display:flex;align-items:center;gap:12px}'.$root.' .lp-t-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover}'
            .$root.' .lp-t-name{font-weight:700}'.$root.' .lp-t-role{opacity:.7;font-size:.9em}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $rating = max(0, min(5, (int) $this->c($node, 'rating', 0)));
        $stars = $rating > 0 ? '<div class="lp-t-stars" aria-label="'.$rating.' out of 5">'.str_repeat('★', $rating).str_repeat('☆', 5 - $rating).'</div>' : '';
        $avatar = Sanitizer::url($this->c($node, 'avatar', ''), ['http', 'https']);

        return $this->open($node, $ctx).$stars
            .'<blockquote>'.nl2br(e((string) $this->c($node, 'quote', ''))).'</blockquote>'
            .'<div class="lp-t-who">'.($avatar !== '' ? '<img class="lp-t-avatar" src="'.e($avatar).'" alt="" loading="lazy" width="48" height="48">' : '')
            .'<div><div class="lp-t-name">'.e((string) $this->c($node, 'name', '')).'</div><div class="lp-t-role">'.e((string) $this->c($node, 'role', '')).'</div></div></div></div>';
    }
}
