<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use Illuminate\Support\Facades\Blade;

/**
 * Custom Code Element.
 * Supports HTML, PHP / Blade, JavaScript, and CSS.
 * Provides live canvas preview, dynamic server-side PHP evaluation,
 * and comprehensive layout, styling, and spacing controls.
 */
class CustomCodeElement extends AbstractElement
{
    public function type(): string
    {
        return 'custom_code';
    }

    public function label(): string
    {
        return 'Custom Code';
    }

    public function category(): string
    {
        return 'advanced';
    }

    public function accepts(): array
    {
        return [];
    }

    public function defaults(): array
    {
        return [
            'content' => [
                'language' => 'html',
                'code' => '',
                'html_tag' => 'div',
            ],
            'settings' => [
                'display_type' => 'block',
                'width' => '100%',
            ],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        $C = fn (string $sec, array $o = []) => $o + ['tab' => 'content', 'section' => $sec];
        $L = fn (array $o = []) => $o + ['tab' => 'content', 'store' => 'settings', 'section' => 'Layout', 'responsive' => true];

        return [
            Control::select('language', 'Language / Syntax', [
                'html' => 'HTML / Mixed (HTML, CSS, JS)',
                'php' => 'PHP / Blade (Dynamic Server Code)',
                'javascript' => 'JavaScript (<script>)',
                'css' => 'CSS (<style>)',
            ], $C('Custom Code', [
                'default' => 'html',
                'help' => 'Select language to run / render in live preview & public page.',
            ])),

            Control::code('code', 'Code Editor', $C('Custom Code', [
                'language' => 'raw',
                'help' => 'Write or paste your custom code. It renders live in the editor preview.',
            ])),

            // Layout & Wrapper controls
            Control::select('html_tag', 'HTML Wrapper Tag', [
                'div' => 'div',
                'section' => 'section',
                'article' => 'article',
                'aside' => 'aside',
                'header' => 'header',
                'footer' => 'footer',
                'main' => 'main',
                'span' => 'span',
            ], $C('Layout', ['default' => 'div'])),

            Control::select('display_type', 'Display', [
                'block' => 'Block',
                'flex' => 'Flex Container',
                'grid' => 'Grid Container',
                'inline-block' => 'Inline Block',
            ], $L(['default' => 'block'])),

            Control::select('flex_direction', 'Direction', [
                'column' => 'Vertical (Column)',
                'row' => 'Horizontal (Row)',
                'column-reverse' => 'Vertical Reverse',
                'row-reverse' => 'Horizontal Reverse',
            ], $L(['if' => ['display_type' => ['flex']]])),

            Control::select('flex_wrap', 'Wrap', [
                'nowrap' => 'No Wrap',
                'wrap' => 'Wrap',
            ], $L(['if' => ['display_type' => ['flex']]])),

            Control::select('align_items', 'Align Items', [
                'stretch' => 'Stretch',
                'flex-start' => 'Start',
                'center' => 'Center',
                'flex-end' => 'End',
            ], $L(['if' => ['display_type' => ['flex']]])),

            Control::select('justify_content', 'Justify Content', [
                'flex-start' => 'Start',
                'center' => 'Center',
                'flex-end' => 'End',
                'space-between' => 'Space Between',
                'space-around' => 'Space Around',
            ], $L(['if' => ['display_type' => ['flex']]])),

            Control::text('gap', 'Gap', $L(['placeholder' => '16px', 'if' => ['display_type' => ['flex', 'grid']]])),
            Control::text('width', 'Width', $L(['placeholder' => '100% / 600px'])),
            Control::text('max_width', 'Max Width', $L(['placeholder' => '1140px'])),
            Control::text('min_height', 'Min Height', $L(['placeholder' => 'auto / 200px'])),
        ];
    }

    protected function styleGroups(): array
    {
        return ['typography', 'color', 'background', 'border', 'effects', 'size'];
    }

    protected function advancedGroups(): array
    {
        return ['spacing', 'visibility', 'animation', 'attributes'];
    }

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $css = '';
        $disp = $this->s($node, 'display_type', 'block');
        if ($disp === 'flex') {
            $css .= "{$root}{display:flex;}";
        } elseif ($disp === 'grid') {
            $css .= "{$root}{display:grid;}";
        } elseif ($disp === 'inline-block') {
            $css .= "{$root}{display:inline-block;}";
        }

        return $css;
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        if (! $ctx->allowCustomCode) {
            return '';
        }
        $ctx->hasCustomCode = true;

        $code = (string) $this->c($node, 'code', '');
        $lang = (string) $this->c($node, 'language', 'html');
        $tag = $this->tag($this->c($node, 'html_tag', 'div'), ['div', 'section', 'article', 'aside', 'header', 'footer', 'main', 'span'], 'div');

        $rendered = '';

        if (trim($code) === '') {
            if ($ctx->editing && empty($children)) {
                $rendered = '<div class="lp-placeholder lp-code-empty" style="padding: 24px; text-align: center; border: 2px dashed #94a3b8; border-radius: 8px; color: #64748b; font-size: 13px; font-family: inherit; background: rgba(241, 245, 249, 0.5); width: 100%;">'
                    . '<div style="font-weight: 600; margin-bottom: 4px; color: #334155;">Custom Code Block (' . strtoupper($lang) . ')</div>'
                    . '<div style="font-size: 11px; opacity: 0.85;">Click to enter custom code, or adjust layout & style in the sidebar.</div>'
                    . '</div>';
            }
        } else {
            $rendered = $this->renderCode($code, $lang, $ctx);
        }

        $body = $rendered;
        if (! empty($children)) {
            $body .= $children;
        }

        return $this->open($node, $ctx, $tag) . $body . '</' . $tag . '>';
    }

    protected function renderCode(string $code, string $lang, RenderContext $ctx): string
    {
        switch ($lang) {
            case 'php':
                return $this->renderPhp($code, $ctx);

            case 'javascript':
                $trimmed = trim($code);
                if (! str_starts_with($trimmed, '<script')) {
                    return '<script type="text/javascript">' . $code . '</script>';
                }
                return $code;

            case 'css':
                $trimmed = trim($code);
                if (! str_starts_with($trimmed, '<style')) {
                    return '<style>' . $code . '</style>';
                }
                return $code;

            case 'html':
            default:
                if (! $ctx->product && ! empty($ctx->settings['product_id'])) {
                    $ctx->product = \App\Models\Product::with('images')->find($ctx->settings['product_id']);
                }

                if ($ctx->product) {
                    $p = $ctx->product;
                    $mainImg = OrderFormElement::productImageUrl($p);
                    $gallery = $p->images ? $p->images->map(fn ($img) => OrderFormElement::formatImageUrl($img->image_path))->filter()->values()->all() : [];
                    $allImgs = array_values(array_filter(array_merge([$mainImg], $gallery)));
                    $price = OrderFormElement::unitPrice($p);

                    // 1. Auto-substitute gallery thumbnails & content <img> tags with product images
                    if (! empty($allImgs)) {
                        // 1a. First replace thumb-item buttons (data-src + inner <img> together)
                        $thumbIdx = 0;
                        $code = preg_replace_callback('/<button\b([^>]*\bclass=["\'][^"\']*thumb-item[^"\']*["\'][^>]*)>([\s\S]*?)<\/button>/i', function ($m) use (&$thumbIdx, $allImgs) {
                            $btnAttrs = $m[1];
                            $inner = $m[2];
                            $imgUrl = $allImgs[$thumbIdx % count($allImgs)];
                            $thumbIdx++;
                            $newBtnAttrs = preg_replace('/\bdata-src=["\'][^"\']*["\']/i', 'data-src="' . e($imgUrl) . '"', $btnAttrs);
                            $newInner = preg_replace('/\bsrc=["\'][^"\']*["\']/i', 'src="' . e($imgUrl) . '"', $inner);
                            return '<button' . $newBtnAttrs . '>' . $newInner . '</button>';
                        }, $code);

                        // 1b. Substitute remaining content <img> tags in sequence
                        $imgIndex = 0;
                        $code = preg_replace_callback('/<img\b([^>]*)>/i', function ($match) use (&$imgIndex, $allImgs) {
                            $attrs = $match[1];
                            if (preg_match('/(icon|logo|whatsapp|fb|facebook|badge|star|trust|arrow|svg|payment|cod|bkash|nagad|rocket|call|phone|delivery-charge)/i', $attrs)) {
                                return $match[0];
                            }
                            $newSrc = $allImgs[$imgIndex % count($allImgs)];
                            $imgIndex++;
                            if (preg_match('/\bsrc=["\'][^"\']*["\']/i', $attrs)) {
                                $newAttrs = preg_replace('/\bsrc=["\'][^"\']*["\']/i', 'src="' . e($newSrc) . '"', $attrs);
                            } else {
                                $newAttrs = 'src="' . e($newSrc) . '" ' . $attrs;
                            }
                            return '<img' . $newAttrs . '>';
                        }, $code);
                    }

                    // 2. Auto-wire any <form> in custom code so it submits to the store as a valid order
                    if (str_contains($code, '<form')) {
                        $ctx->hasForm = true;
                        if (! str_contains($code, 'data-lp-form')) {
                            $code = preg_replace('/<form\b/i', '<form data-lp-form="custom_order_form"', $code);
                        }
                        if (! str_contains($code, 'name="pick[]"') && ! str_contains($code, 'name="product_id"')) {
                            $code = preg_replace('/<form\b([^>]*)>/i', '$0<input type="hidden" name="pick[]" value="' . $p->id . '">', $code);
                        }

                        // Auto-fix inputs missing `name` attributes so standard browser FormData sends them
                        $code = preg_replace_callback('/<input\b(?![^>]*\bname=)([^>]*(?:id=["\']?cName["\']?|placeholder=["\'][^"\']*নাম[^"\']*["\'])[^>]*)>/i', function ($m) {
                            return '<input name="name" ' . $m[1] . '>';
                        }, $code);

                        $code = preg_replace_callback('/<input\b(?![^>]*\bname=)([^>]*(?:id=["\']?cPhone["\']?|type=["\']tel["\']|placeholder=["\'][^"\']*01[^"\']*["\'])[^>]*)>/i', function ($m) {
                            return '<input name="phone" ' . $m[1] . '>';
                        }, $code);

                        $code = preg_replace_callback('/<input\b(?![^>]*\bname=)([^>]*(?:id=["\']?cAddress["\']?|placeholder=["\'][^"\']*(?:ঠিকানা|বাসা|রোড)[^"\']*["\'])[^>]*)>/i', function ($m) {
                            return '<input name="address" ' . $m[1] . '>';
                        }, $code);
                    }

                    // 3. Replace template shortcodes
                    $code = str_replace(
                        [
                            '{product_name}', '{product_price}', '{product_original_price}', '{product_discount}',
                            '{product_image_url}', '{product_image}',
                            '{gallery_1}', '{gallery_2}', '{gallery_3}', '{gallery_4}',
                        ],
                        [
                            e($p->name),
                            '৳'.number_format($price),
                            '৳'.number_format((float) $p->price),
                            ($p->discount ? $p->discount.'%' : ''),
                            e($mainImg ?? ''),
                            $mainImg ? '<img src="'.e($mainImg).'" alt="'.e($p->name).'" class="lp-product-img" style="max-width:100%;height:auto;border-radius:8px;">' : '',
                            e($allImgs[1] ?? $mainImg ?? ''),
                            e($allImgs[2] ?? $mainImg ?? ''),
                            e($allImgs[3] ?? $mainImg ?? ''),
                            e($allImgs[4] ?? $mainImg ?? ''),
                        ],
                        $code
                    );
                } else {
                    // Even without linked product, wire custom form
                    if (str_contains($code, '<form')) {
                        $ctx->hasForm = true;
                        if (! str_contains($code, 'data-lp-form')) {
                            $code = preg_replace('/<form\b/i', '<form data-lp-form="custom_order_form"', $code);
                        }
                    }
                }

                // If HTML contains embedded PHP tags <?php or <?=, evaluate with Blade/PHP
                if (str_contains($code, '<?php') || str_contains($code, '<?=')) {
                    return $this->renderPhp($code, $ctx);
                }
                return $code;
        }
    }

    protected function renderPhp(string $code, RenderContext $ctx): string
    {
        try {
            $isBlade = str_contains($code, '{{') || str_contains($code, '{!!') || preg_match('/@(if|foreach|for|while|php|switch|auth|guest|isset|empty|class|style|dump|dd)/', $code);
            $hasPhpTag = str_contains($code, '<?php') || str_contains($code, '<?=');

            if (! $isBlade && ! $hasPhpTag) {
                $toExecute = '<?php ' . $code . ' ?>';
            } else {
                $toExecute = $code;
            }

            return Blade::render($toExecute, [
                'ctx' => $ctx,
                'vars' => $ctx->vars,
                'product' => $ctx->product,
            ]);
        } catch (\Throwable $e) {
            report($e);
            if ($ctx->editing) {
                return '<div class="lp-php-error" style="background:#fef2f2;border:1px solid #f87171;color:#b91c1c;padding:12px;border-radius:6px;font-family:monospace;font-size:12px;margin:8px 0;line-height:1.4;">'
                    . '<div style="font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:4px;">'
                    . '<span>&#9888; PHP Execution Error</span>'
                    . '</div>'
                    . '<div>' . nl2br(e($e->getMessage())) . '</div>'
                    . '<div style="font-size:10px;margin-top:6px;color:#ef4444;">at line ' . $e->getLine() . '</div>'
                    . '</div>';
            }

            return '<!-- PHP Error: ' . e($e->getMessage()) . ' -->';
        }
    }
}
