<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\CssBuilder;
use App\Landing\Builder\RenderContext;
use App\Landing\Builder\StyleCompiler;
use App\Landing\Support\Icons;
use App\Landing\Support\Sanitizer;

class IconBoxElement extends AbstractElement
{
    private const ALIGN_ITEMS = ['left' => 'flex-start', 'center' => 'center', 'right' => 'flex-end', 'justify' => 'stretch'];


    public function type(): string
    {
        return 'icon_box';
    }

    public function label(): string
    {
        return 'Icon Box';
    }

    public function category(): string
    {
        return 'content';
    }

    public function defaults(): array
    {
        return [
            'content' => ['icon' => 'zap', 'title' => 'Fast Results', 'description' => 'Explain this benefit in one or two short sentences.', 'tag' => 'h3'],
            'settings' => ['align' => 'center', 'icon_color' => '#2563eb', 'icon_size' => '40px', 'padding' => ['desktop' => ['top' => '24px', 'right' => '24px', 'bottom' => '24px', 'left' => '24px']]],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        return [
            Control::icon('icon', 'Icon', ['default' => 'zap']),
            Control::text('title', 'Title'),
            Control::textarea('description', 'Description', ['rows' => 3]),
            Control::select('tag', 'Title tag', ['h2' => 'H2', 'h3' => 'H3', 'h4' => 'H4', 'h5' => 'H5', 'div' => 'div'], ['default' => 'h3']),
            Control::url('link', 'Link'),
        ];
    }

    protected function styleControls(): array
    {
        $S = fn (array $o = []) => $o + ['tab' => 'style', 'section' => 'Icon & title'];

        return [
            Control::color('icon_color', 'Icon color', $S()),
            Control::text('icon_size', 'Icon size', $S(['placeholder' => '40px', 'responsive' => true])),
            Control::color('title_color', 'Title color', $S()),
            Control::color('description_color', 'Description color', $S()),
        ];
    }

    protected function styleGroups(): array
    {
        return ['background', 'border', 'effects', 'typography'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $s = $node['settings'] ?? [];
        $css = new CssBuilder;
        // Flex column, full height and vertically centred: when several icon boxes sit in a stretched
        // row (e.g. a trust-badge strip), one having a longer title/description no longer leaves the
        // shorter ones looking top-heavy or misaligned against it - every box centres its own content
        // in whatever height the row gives it. Horizontal alignment reuses the box's own "align" setting.
        $css->raw($root.'{display:flex;flex-direction:column;justify-content:center;height:100%;box-sizing:border-box}');
        // Title/description keep full width so long text still wraps normally - only the flex
        // container's align-items positions the (already full-width) block, not the text itself;
        // text-align (set generically from the same "align" setting) centres the wrapped lines.
        $css->raw($root.' .lp-ib-icon{display:block;margin-bottom:12px}'.$root.' .lp-ib-title{margin:0 0 8px;font-size:1.25em;width:100%}'.$root.' .lp-ib-desc{margin:0;width:100%}');
        $align = array_map(fn ($v) => $v === null ? null : (self::ALIGN_ITEMS[$v] ?? null), StyleCompiler::resolve($s['align'] ?? 'center'));
        if ($align['mobile'] !== null || $align['tablet'] !== null || $align['desktop'] !== null) {
            $css->add($root, 'align-items', $align);
        }
        if ($c = Sanitizer::color($s['icon_color'] ?? '')) {
            $css->raw($root.' .lp-ib-icon{color:'.$c.'}');
        }
        // Responsive, mobile-first (base = mobile, min-width overrides for tablet/desktop) so a row of
        // icon boxes can shrink its icon on small screens instead of forcing the same size everywhere.
        $sizes = array_map(fn ($v) => $v === null ? null : Sanitizer::length($v), StyleCompiler::resolve($s['icon_size'] ?? null));
        if ($sizes['mobile'] !== null || $sizes['tablet'] !== null || $sizes['desktop'] !== null) {
            $css->add($root.' .lp-ib-icon', 'font-size', $sizes);
        }
        if ($c = Sanitizer::color($s['title_color'] ?? '')) {
            $css->raw($root.' .lp-ib-title{color:'.$c.'}');
        }
        if ($c = Sanitizer::color($s['description_color'] ?? '')) {
            $css->raw($root.' .lp-ib-desc{color:'.$c.'}');
        }

        return $css->toString();
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $tag = $this->tag($this->c($node, 'tag', 'h3'), ['h2', 'h3', 'h4', 'h5', 'div'], 'h3');
        $title = e((string) $this->c($node, 'title', ''));
        $link = Sanitizer::url($this->c($node, 'link', ''));
        if ($link !== '' && $title !== '') {
            $title = '<a href="'.e($link).'" style="color:inherit;text-decoration:none">'.$title.'</a>';
        }

        return $this->open($node, $ctx)
            .'<span class="lp-ib-icon">'.Icons::svg($this->c($node, 'icon', 'zap')).'</span>'
            .($title !== '' ? '<'.$tag.' class="lp-ib-title">'.$title.'</'.$tag.'>' : '')
            .'<p class="lp-ib-desc">'.nl2br(e((string) $this->c($node, 'description', ''))).'</p></div>';
    }
}
