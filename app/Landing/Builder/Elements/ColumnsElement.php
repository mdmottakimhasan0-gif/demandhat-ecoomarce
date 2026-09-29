<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;

class ColumnsElement extends AbstractElement
{
    /** preset => column count is derived from the value */
    public const PRESETS = [
        '100' => '100%',
        '50-50' => '50 / 50',
        '33-33-33' => '33 / 33 / 33',
        '25-25-25-25' => '25 / 25 / 25 / 25',
        '25-75' => '25 / 75',
        '75-25' => '75 / 25',
        '33-67' => '33 / 67',
        '67-33' => '67 / 33',
        'custom' => 'Custom',
    ];

    public function type(): string
    {
        return 'columns';
    }

    public function label(): string
    {
        return 'Columns';
    }

    public function category(): string
    {
        return 'layout';
    }

    public function accepts(): array
    {
        return ['column'];
    }

    public function defaults(): array
    {
        $col = ['type' => 'column', 'content' => [], 'settings' => [], 'children' => []];

        return [
            'content' => ['layout' => '50-50', 'tablet_layout' => 'same', 'mobile_layout' => '1', 'mobile_reverse' => false],
            'settings' => ['gap' => ['desktop' => '24px', 'mobile' => '16px']],
            'children' => [$col, $col],
        ];
    }

    /** Parse "33-67" into [33, 67]. */
    public static function fractions(array $content): array
    {
        $layout = (string) ($content['layout'] ?? '50-50');
        if ($layout === 'custom') {
            $layout = (string) ($content['custom_layout'] ?? '50-50');
        }
        $parts = array_values(array_filter(array_map('intval', explode('-', $layout)), fn ($n) => $n > 0 && $n <= 100));

        return array_slice($parts ?: [100], 0, 6);
    }

    protected function contentControls(): array
    {
        return [
            Control::select('layout', 'Layout', self::PRESETS, ['default' => '50-50', 'columns_layout' => true]),
            Control::text('custom_layout', 'Custom widths', ['placeholder' => '20-30-50', 'columns_layout' => true, 'help' => 'Dash separated, e.g. 20-30-50', 'if' => ['layout' => ['custom']]]),
            Control::select('tablet_layout', 'Tablet columns', ['same' => 'Same as desktop', '1' => '1 column', '2' => '2 columns', '3' => '3 columns'], ['default' => 'same']),
            Control::select('mobile_layout', 'Mobile columns', ['1' => '1 column (stacked)', '2' => '2 columns', '3' => '3 columns', '4' => '4 columns (one line)'], ['default' => '1']),
            Control::switch('mobile_reverse', 'Reverse order when stacked'),
            Control::text('gap', 'Column gap', ['tab' => 'content', 'store' => 'settings', 'responsive' => true, 'placeholder' => '24px']),
            Control::select('align_items', 'Vertical alignment', ['stretch' => 'Stretch', 'flex-start' => 'Top', 'center' => 'Middle', 'flex-end' => 'Bottom'], ['tab' => 'content', 'store' => 'settings']),
        ];
    }

    protected function styleGroups(): array
    {
        return ['background', 'border', 'effects'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $c = $node['content'] ?? [];
        $fr = self::fractions($c);
        $n = count($fr);

        $desktop = implode(' ', array_map(fn ($f) => "minmax(0,{$f}fr)", $fr));
        $tabletN = ($c['tablet_layout'] ?? 'same') === 'same' ? null : max(1, min(4, (int) $c['tablet_layout']));
        $mobileN = max(1, min(4, (int) ($c['mobile_layout'] ?? 1)));
        $repeat = fn (int $k) => 'repeat('.min($k, max($n, 1)).',minmax(0,1fr))';

        $css = "{$root}{grid-template-columns:".$repeat($mobileN).'}';
        $css .= '@media(min-width:768px){'.$root.'{grid-template-columns:'.($tabletN ? $repeat($tabletN) : $desktop).'}}';
        $css .= '@media(min-width:1025px){'.$root.'{grid-template-columns:'.$desktop.'}}';

        if (! empty($c['mobile_reverse']) && $mobileN === 1) {
            $css .= '@media(max-width:767px){';
            for ($i = 1; $i <= $n; $i++) {
                $css .= "{$root}>.lp-column:nth-child({$i}){order:".($n - $i + 1).'}';
            }
            $css .= '}';
        }

        return $css;
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        return $this->open($node, $ctx).$this->kids($children, $ctx).'</div>';
    }
}
