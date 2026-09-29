<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;

class TeamElement extends AbstractElement
{
    public function type(): string
    {
        return 'team';
    }

    public function label(): string
    {
        return 'Team';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => ['members' => [
                ['image' => '', 'name' => 'Alex Morgan', 'role' => 'Founder', 'bio' => ''],
                ['image' => '', 'name' => 'Sam Rivera', 'role' => 'Head of Growth', 'bio' => ''],
                ['image' => '', 'name' => 'Taylor Kim', 'role' => 'Lead Designer', 'bio' => ''],
            ]],
            'settings' => ['columns' => ['desktop' => 3, 'tablet' => 2, 'mobile' => 1], 'grid_gap' => '24px', 'align' => 'center'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [
            Control::repeater('members', 'Members', [
                Control::image('image', 'Photo'),
                Control::text('name', 'Name'),
                Control::text('role', 'Role'),
                Control::textarea('bio', 'Short bio', ['rows' => 2]),
            ], ['image' => '', 'name' => 'Team member', 'role' => 'Role', 'bio' => ''], ['title_field' => 'name']),
            $this->columnsControl(),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'effects'];
    }

    protected function styleControls(): array
    {
        return [Control::text('grid_gap', 'Gap', ['tab' => 'style', 'section' => 'Layout', 'responsive' => true, 'placeholder' => '24px'])];
    }

    public function innerSelector(string $root): ?string
    {
        return $root.' .lp-team-grid';
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $root.' .lp-team-grid{display:grid}'
            .$this->gridCss($node, $root.' .lp-team-grid')
            .$root.' .lp-team-card{text-align:inherit}'.$root.' .lp-team-photo{width:120px;height:120px;border-radius:50%;object-fit:cover;background:#e5e7eb;margin:0 auto 12px;display:block}'
            .$root.' .lp-team-name{font-weight:700;font-size:1.1em}'.$root.' .lp-team-role{opacity:.7}'.$root.' .lp-team-bio{margin:8px 0 0;font-size:.95em}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $cards = '';
        foreach ((array) $this->c($node, 'members', []) as $m) {
            $img = Sanitizer::url($m['image'] ?? '', ['http', 'https']);
            $cards .= '<div class="lp-team-card">'
                .($img !== '' ? '<img class="lp-team-photo" src="'.e($img).'" alt="'.e((string) ($m['name'] ?? '')).'" loading="lazy" width="120" height="120">' : '<span class="lp-team-photo"></span>')
                .'<div class="lp-team-name">'.e((string) ($m['name'] ?? '')).'</div><div class="lp-team-role">'.e((string) ($m['role'] ?? '')).'</div>'
                .(! empty($m['bio']) ? '<p class="lp-team-bio">'.e((string) $m['bio']).'</p>' : '').'</div>';
        }

        return $this->open($node, $ctx).'<div class="lp-team-grid">'.$cards.'</div></div>';
    }
}
