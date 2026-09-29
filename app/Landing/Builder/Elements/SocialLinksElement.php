<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Icons;
use App\Landing\Support\Sanitizer;

class SocialLinksElement extends AbstractElement
{
    private const NETWORKS = ['facebook' => 'Facebook', 'instagram' => 'Instagram', 'youtube' => 'YouTube', 'linkedin' => 'LinkedIn', 'twitter' => 'X / Twitter', 'whatsapp' => 'WhatsApp', 'tiktok' => 'TikTok', 'mail' => 'Email'];

    public function type(): string
    {
        return 'social_links';
    }

    public function label(): string
    {
        return 'Social Links';
    }

    public function category(): string
    {
        return 'marketing';
    }

    public function defaults(): array
    {
        return [
            'content' => ['links' => [['network' => 'facebook', 'url' => 'https://facebook.com/'], ['network' => 'instagram', 'url' => 'https://instagram.com/'], ['network' => 'youtube', 'url' => 'https://youtube.com/']]],
            'settings' => ['align' => 'center', 'font_size' => '24px'],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [Control::repeater('links', 'Links', [
            Control::select('network', 'Network', self::NETWORKS, ['default' => 'facebook']),
            Control::url('url', 'URL'),
        ], ['network' => 'facebook', 'url' => ''], ['title_field' => 'network'])];
    }

    protected function styleGroups(): array
    {
        return ['color', 'effects'];
    }

    protected function styleControls(): array
    {
        return [
            Control::text('font_size', 'Icon size', ['tab' => 'style', 'section' => 'Icons', 'responsive' => true, 'placeholder' => '24px']),
            Control::text('grid_gap', 'Spacing', ['tab' => 'style', 'section' => 'Icons', 'placeholder' => '14px']),
        ];
    }

    public function innerSelector(string $root): ?string
    {
        return $root.' .lp-social-list';
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        return $root.' .lp-social-list{display:inline-flex;flex-wrap:wrap;gap:14px;justify-content:center}'.$root.' a{color:inherit;display:inline-flex;padding:4px}';
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $items = '';
        foreach ((array) $this->c($node, 'links', []) as $l) {
            $net = $l['network'] ?? '';
            $url = Sanitizer::url($l['url'] ?? '', ['http', 'https', 'mailto', 'tel']);
            if ($url === '' || ! isset(self::NETWORKS[$net])) {
                continue;
            }
            $items .= '<a href="'.e($url).'" target="_blank" rel="noopener noreferrer" aria-label="'.e(self::NETWORKS[$net]).'">'.Icons::svg($net === 'mail' ? 'mail' : $net).'</a>';
        }

        return $this->open($node, $ctx).'<div class="lp-social-list">'.$items.'</div></div>';
    }
}
