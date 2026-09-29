<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;

/**
 * Allowlisted dynamic text. Output is always escaped, so a shortcode can never inject markup.
 * [year] [date] [site_name] [page_title] [utm_source] [utm_medium] [utm_campaign] [utm_term] [utm_content]
 */
class ShortcodeElement extends AbstractElement
{
    private const CODES = ['year', 'date', 'site_name', 'page_title', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    public function type(): string
    {
        return 'shortcode';
    }

    public function label(): string
    {
        return 'Shortcode';
    }

    public function category(): string
    {
        return 'advanced';
    }

    public function defaults(): array
    {
        return ['content' => ['code' => '© [year] [site_name]. All rights reserved.'], 'settings' => ['align' => 'center'], 'children' => []];
    }

    protected function contentControls(): array
    {
        return [Control::textarea('code', 'Text with shortcodes', ['rows' => 3, 'help' => 'Available: '.implode(' ', array_map(fn ($c) => '['.$c.']', self::CODES))])];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color'];
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $text = (string) $this->c($node, 'code', '');
        $vars = $ctx->vars + ['year' => date('Y'), 'date' => date('F j, Y'), 'site_name' => config('app.name'), 'page_title' => $ctx->vars['page_title'] ?? ''];

        // Text outside a matched shortcode is escaped as well.
        $parts = preg_split('/(\[[a-z_]+\])/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
        $out = '';
        foreach ($parts as $part) {
            if (preg_match('/^\[([a-z_]+)\]$/', $part, $m) && in_array($m[1], self::CODES, true)) {
                $out .= ($ctx->deferVars && str_starts_with($m[1], 'utm_'))
                    ? '[[lp:'.$m[1].']]'
                    : e((string) ($vars[$m[1]] ?? ''));
            } else {
                $out .= e($part);
            }
        }

        return $this->open($node, $ctx).nl2br($out).'</div>';
    }
}
