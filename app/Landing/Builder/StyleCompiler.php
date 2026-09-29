<?php

namespace App\Landing\Builder;

use App\Landing\Support\Sanitizer;

/**
 * Turns an element's `settings` into scoped, sanitised CSS.
 * Two scopes exist: "root" (layout-ish keys on the outer element) and
 * "skin" (visual keys, which elements may redirect to an inner selector).
 */
class StyleCompiler
{
    private const SIDES = ['top', 'right', 'bottom', 'left'];

    /** key => [scope, css property, type] */
    private const MAP = [
        'margin' => ['root', 'margin', 'box'],
        'width' => ['root', 'width', 'len'],
        'max_width' => ['root', 'max-width', 'len'],
        'min_height' => ['root', 'min-height', 'len'],
        'align' => ['root', 'text-align', 'enum:left,center,right,justify'],
        'padding' => ['skin', 'padding', 'box'],
        'height' => ['skin', 'height', 'len'],
        'img_width' => ['skin', 'width', 'len'],
        'img_max_width' => ['skin', 'max-width', 'len'],
        'color' => ['skin', 'color', 'color'],
        'font_family' => ['skin', 'font-family', 'font'],
        'font_size' => ['skin', 'font-size', 'len'],
        'font_weight' => ['skin', 'font-weight', 'weight'],
        'line_height' => ['skin', 'line-height', 'lh'],
        'letter_spacing' => ['skin', 'letter-spacing', 'len'],
        'text_transform' => ['skin', 'text-transform', 'enum:none,uppercase,lowercase,capitalize'],
        'background_color' => ['skin', 'background-color', 'color'],
        'border_color' => ['skin', 'border-color', 'color'],
        'border_radius' => ['skin', 'border-radius', 'radius'],
        'box_shadow' => ['skin', 'box-shadow', 'shadow'],
        'opacity' => ['skin', 'opacity', 'opacity'],
        'gap' => ['skin', 'gap', 'len'],
        'grid_gap' => ['inner', 'gap', 'len'],
        'flex_direction' => ['skin', 'flex-direction', 'enum:row,column,row-reverse,column-reverse'],
        'flex_wrap' => ['skin', 'flex-wrap', 'enum:wrap,nowrap'],
        'align_items' => ['skin', 'align-items', 'enum:flex-start,center,flex-end,stretch'],
        'justify_content' => ['skin', 'justify-content', 'enum:flex-start,center,flex-end,space-between,space-around'],
        'object_fit' => ['skin', 'object-fit', 'enum:cover,contain,fill,none'],
        'display' => ['root', 'display', 'enum:block,flex,grid,inline-block,inline-flex,none'],
        'display_type' => ['root', 'display', 'enum:block,flex,grid,inline-block,inline-flex,none'],
    ];

    public const SHADOWS = [
        'none' => 'none',
        'sm' => '0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.08)',
        'md' => '0 4px 12px rgba(0,0,0,.12)',
        'lg' => '0 12px 32px rgba(0,0,0,.16)',
        'xl' => '0 24px 60px rgba(0,0,0,.22)',
    ];

    /** Collapse a raw settings value into [mobile, tablet, desktop] using desktop-first inheritance. */
    public static function resolve(mixed $value): array
    {
        $isResponsive = is_array($value)
            && (array_key_exists('desktop', $value) || array_key_exists('tablet', $value) || array_key_exists('mobile', $value));

        if (! $isResponsive) {
            $v = self::blank($value) ? null : $value;

            return ['mobile' => $v, 'tablet' => $v, 'desktop' => $v];
        }

        $d = self::blank($value['desktop'] ?? null) ? null : $value['desktop'];
        $t = self::blank($value['tablet'] ?? null) ? $d : $value['tablet'];
        $m = self::blank($value['mobile'] ?? null) ? $t : $value['mobile'];

        return ['mobile' => $m, 'tablet' => $t, 'desktop' => $d];
    }

    private static function blank(mixed $v): bool
    {
        return $v === null || $v === '' || $v === [];
    }

    public function compile(array $settings, string $root, ?string $skin = null, ?string $inner = null): CssBuilder
    {
        $skin ??= $root;
        $inner ??= $skin;
        $css = new CssBuilder;

        foreach (self::MAP as $key => [$scope, $prop, $type]) {
            if (! array_key_exists($key, $settings)) {
                continue;
            }
            $selector = match ($scope) {
                'root' => $root,
                'inner' => $inner,
                default => $skin,
            };
            $resolved = self::resolve($settings[$key]);

            if ($type === 'box') {
                $this->emitBox($css, $selector, $prop, $settings[$key]);

                continue;
            }
            if ($type === 'radius') {
                $this->emitRadius($css, $selector, $settings[$key]);

                continue;
            }

            $clean = array_map(fn ($v) => $v === null ? null : $this->clean($type, $v), $resolved);
            if ($clean['mobile'] !== null || $clean['tablet'] !== null || $clean['desktop'] !== null) {
                $css->add($selector, $prop, $clean);
            }
        }

        $this->emitBorder($css, $skin, $settings);
        $this->emitBackground($css, $skin, $settings);
        $this->emitTextGradient($css, $skin, $settings);
        $this->emitHover($css, $skin, $settings);
        $this->emitVisibility($css, $root, $settings);

        $custom = Sanitizer::css($settings['custom_css'] ?? '', $root);
        if ($custom !== '') {
            $css->raw($custom);
        }

        return $css;
    }

    private function clean(string $type, mixed $v): ?string
    {
        if (str_starts_with($type, 'enum:')) {
            return Sanitizer::enum($v, explode(',', substr($type, 5)));
        }

        return match ($type) {
            'len' => Sanitizer::length($v),
            'color' => Sanitizer::color($v),
            'font' => Sanitizer::fontFamily(is_string($v) ? $v : null),
            'weight' => is_scalar($v) && preg_match('/^(normal|bold|[1-9]00)$/', (string) $v) ? (string) $v : null,
            'lh' => is_numeric($v) ? Sanitizer::number($v, 0, 10) : Sanitizer::length($v),
            'shadow' => self::SHADOWS[$v] ?? null,
            'opacity' => Sanitizer::number($v, 0, 1),
            default => null,
        };
    }

    private function emitBox(CssBuilder $css, string $selector, string $prop, mixed $raw): void
    {
        $r = self::resolve($raw);
        foreach (self::SIDES as $side) {
            $per = [];
            foreach (['desktop', 'tablet', 'mobile'] as $dev) {
                $per[$dev] = is_array($r[$dev]) ? Sanitizer::length($r[$dev][$side] ?? null) : null;
            }
            // Side-level inheritance (desktop -> tablet -> mobile)
            $per['tablet'] ??= $per['desktop'];
            $per['mobile'] ??= $per['tablet'];
            if ($per['desktop'] !== null || $per['tablet'] !== null || $per['mobile'] !== null) {
                $css->add($selector, $prop.'-'.$side, $per);
            }
        }
    }

    private function emitRadius(CssBuilder $css, string $selector, mixed $raw): void
    {
        $r = self::resolve($raw);
        $isBox = fn ($v) => is_array($v);
        if (! $isBox($r['desktop']) && ! $isBox($r['tablet']) && ! $isBox($r['mobile'])) {
            $c = array_map(fn ($v) => $v === null ? null : Sanitizer::length($v), $r);
            $css->add($selector, 'border-radius', $c);

            return;
        }
        $corners = ['top' => 'top-left', 'right' => 'top-right', 'bottom' => 'bottom-right', 'left' => 'bottom-left'];
        foreach ($corners as $side => $corner) {
            $per = [];
            foreach (['desktop', 'tablet', 'mobile'] as $dev) {
                $per[$dev] = is_array($r[$dev]) ? Sanitizer::length($r[$dev][$side] ?? null) : null;
            }
            $per['tablet'] ??= $per['desktop'];
            $per['mobile'] ??= $per['tablet'];
            $css->add($selector, "border-{$corner}-radius", $per);
        }
    }

    private function emitBorder(CssBuilder $css, string $sel, array $s): void
    {
        if (! isset($s['border_width']) || self::blank($s['border_width'])) {
            return;
        }
        $style = Sanitizer::enum($s['border_style'] ?? 'solid', ['solid', 'dashed', 'dotted', 'double', 'none']) ?? 'solid';
        $css->set($sel, 'border-style', $style);
        $this->emitBox($css, $sel, 'border', $this->wrapWidth($s['border_width']));
    }

    /** A scalar border width is expanded to a box so one code path handles both. */
    private function wrapWidth(mixed $w): mixed
    {
        $r = self::resolve($w);
        $expand = function ($v) {
            return is_array($v) ? $v : ['top' => $v, 'right' => $v, 'bottom' => $v, 'left' => $v];
        };
        foreach ($r as $k => $v) {
            $r[$k] = $v === null ? null : $expand($v);
        }

        return $r;
    }

    private function emitBackground(CssBuilder $css, string $sel, array $s): void
    {
        $type = $s['background_type'] ?? null;
        if (! $type) {
            $type = ! empty($s['gradient_from']) ? 'gradient' : (! empty($s['background_image']) ? 'image' : (! empty($s['background_color']) ? 'color' : 'none'));
        }
        if ($type === 'gradient') {
            $from = Sanitizer::color($s['gradient_from'] ?? '');
            $to = Sanitizer::color($s['gradient_to'] ?? '');
            $angle = Sanitizer::number($s['gradient_angle'] ?? 135, 0, 360) ?? '135';
            if ($from && $to) {
                $css->set($sel, 'background-image', "linear-gradient({$angle}deg,{$from},{$to})");
            }
        } elseif ($type === 'image') {
            $url = Sanitizer::url($s['background_image'] ?? '', ['http', 'https']);
            if ($url !== '') {
                $css->set($sel, 'background-image', 'url("'.str_replace('"', '%22', $url).'")');
                $css->set($sel, 'background-size', Sanitizer::enum($s['background_size'] ?? 'cover', ['cover', 'contain', 'auto']) ?? 'cover');
                $css->set($sel, 'background-position', Sanitizer::enum($s['background_position'] ?? 'center center', [
                    'center center', 'center top', 'center bottom', 'left center', 'right center', 'left top', 'right top', 'left bottom', 'right bottom',
                ]) ?? 'center center');
                $css->set($sel, 'background-repeat', Sanitizer::enum($s['background_repeat'] ?? 'no-repeat', ['no-repeat', 'repeat', 'repeat-x', 'repeat-y']) ?? 'no-repeat');
            }
        }
    }

    private function emitTextGradient(CssBuilder $css, string $sel, array $s): void
    {
        $from = Sanitizer::color($s['text_gradient_from'] ?? '');
        $to = Sanitizer::color($s['text_gradient_to'] ?? '');
        if ($from && $to) {
            $angle = Sanitizer::number($s['text_gradient_angle'] ?? 90, 0, 360) ?? '90';
            $css->set($sel, 'background-image', "linear-gradient({$angle}deg,{$from},{$to})");
            $css->set($sel, '-webkit-background-clip', 'text');
            $css->set($sel, 'background-clip', 'text');
            $css->set($sel, '-webkit-text-fill-color', 'transparent');
            $css->set($sel, 'color', 'transparent');
        }
    }

    private function emitHover(CssBuilder $css, string $sel, array $s): void
    {
        $map = ['hover_color' => 'color', 'hover_background' => 'background-color', 'hover_border_color' => 'border-color'];
        $any = false;
        foreach ($map as $key => $prop) {
            $c = Sanitizer::color($s[$key] ?? '');
            if ($c) {
                $css->set($sel.':hover', $prop, $c);
                $any = true;
            }
        }
        if ($any) {
            $css->set($sel, 'transition', 'background-color .2s,color .2s,border-color .2s');
        }
    }

    private function emitVisibility(CssBuilder $css, string $root, array $s): void
    {
        $hide = 'display:none!important';
        if (! empty($s['hide_mobile'])) {
            $css->raw('@media(max-width:'.(CssBuilder::TABLET_MIN - 1).'px){'.$root.'{'.$hide.'}}');
        }
        if (! empty($s['hide_tablet'])) {
            $css->raw('@media(min-width:'.CssBuilder::TABLET_MIN.'px) and (max-width:'.(CssBuilder::DESKTOP_MIN - 1).'px){'.$root.'{'.$hide.'}}');
        }
        if (! empty($s['hide_desktop'])) {
            $css->raw('@media(min-width:'.CssBuilder::DESKTOP_MIN.'px){'.$root.'{'.$hide.'}}');
        }
    }
}
