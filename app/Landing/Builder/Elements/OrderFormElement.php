<?php

namespace App\Landing\Builder\Elements;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Control;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;
use App\Models\Product;
use App\Services\DeliveryFee;

/**
 * One-page checkout ("CartFlows style"): billing details + product selection + order bump +
 * live order summary. Placing the order creates a real Order in the shop (COD).
 * Prices, stock and which products may be ordered ALWAYS come from the database and the
 * published page - never from the browser.
 */
class OrderFormElement extends AbstractElement
{
    public const MODES = ['single' => 'Customer picks one product', 'multiple' => 'Customer can pick several', 'fixed' => 'All listed products are included'];

    public function type(): string
    {
        return 'order_form';
    }

    public function label(): string
    {
        return 'Order Form';
    }

    public function category(): string
    {
        return 'marketing';
    }

    public function defaults(): array
    {
        return [
            'content' => [
                'items' => [],
                'mode' => 'single',
                'allow_qty' => true,
                'show_email' => false,
                'show_notes' => false,
                'currency_symbol' => '৳',
                'heading_details' => 'Billing details',
                'heading_order' => 'Your order',
                'label_name' => 'Full name',
                'label_phone' => 'Mobile number',
                'label_address' => 'Full address',
                'label_area' => 'Delivery area',
                'label_inside' => 'Inside Dhaka',
                'label_outside' => 'Outside Dhaka',
                'payment_note' => 'Cash on delivery - pay when you receive the product.',
                'submit_text' => 'Place Order',
                'success_message' => 'Thank you! Your order #{order} has been placed. We will call you shortly to confirm it.',
                'redirect_url' => '',
                'notify_email' => '',
                'block_active_orders' => true,
                'event_enabled' => true,
                'event_name' => 'Purchase',
                'event_browser' => true,
                'event_server' => true,
            ],
            'settings' => [
                'background_type' => 'color', 'background_color' => '#ffffff', 'color' => '#111827',
                'border_radius' => '16px', 'box_shadow' => 'md', 'accent' => '#16a34a',
                'padding' => ['desktop' => ['top' => '32px', 'right' => '32px', 'bottom' => '32px', 'left' => '32px'], 'mobile' => ['top' => '18px', 'right' => '16px', 'bottom' => '18px', 'left' => '16px']],
                'max_width' => '980px',
            ],
            'children' => [],
        ];
    }

    protected function contentControls(): array
    {
        $item = [
            Control::make('product', 'product_id', 'Product'),
            Control::text('label', 'Display name', ['help' => 'Optional. Defaults to the product name.']),
            Control::text('description', 'Short description'),
            Control::switch('selected', 'Selected by default'),
            Control::number('qty', 'Default quantity', ['min' => 1, 'max' => 50, 'default' => 1]),
            Control::switch('bump', 'Order bump (optional add-on checkbox)'),
            Control::text('bump_text', 'Bump headline', ['if' => ['bump' => [true]], 'placeholder' => 'Yes! Add this to my order']),
        ];
        $T = fn (array $o = []) => $o + ['tab' => 'content', 'section' => 'Texts'];

        return array_merge([
            Control::make('product', 'product_id', 'Product (Quick Select)', ['help' => 'Select a product to automatically include in this form with its picture, price and details.', 'section' => 'Products']),
            Control::repeater('items', 'Additional / Multiple Products', $item, ['product_id' => null, 'label' => '', 'description' => '', 'selected' => true, 'qty' => 1, 'bump' => false, 'bump_text' => ''], ['title_field' => 'label', 'section' => 'Products']),
            Control::select('mode', 'Product selection', self::MODES, ['default' => 'single', 'section' => 'Products']),
            Control::switch('allow_qty', 'Let customers change quantity', ['default' => true, 'section' => 'Products']),
            Control::switch('show_email', 'Ask for email (optional)', ['section' => 'Fields']),
            Control::switch('show_notes', 'Ask for order notes (optional)', ['section' => 'Fields']),
            Control::text('fee_inside', 'Flat delivery fee - inside Dhaka', ['section' => 'Delivery', 'help' => 'Leave both empty to use the shop\'s standard delivery rules.', 'placeholder' => 'auto']),
            Control::text('fee_outside', 'Flat delivery fee - outside Dhaka', ['section' => 'Delivery', 'placeholder' => 'auto']),
            Control::text('currency_symbol', 'Currency symbol', $T(['default' => '৳'])),
            Control::text('heading_details', 'Details heading', $T()),
            Control::text('heading_order', 'Order heading', $T()),
            Control::text('label_name', 'Name label', $T()),
            Control::text('label_phone', 'Phone label', $T()),
            Control::text('label_address', 'Address label', $T()),
            Control::text('label_area', 'Delivery area label', $T()),
            Control::text('label_inside', 'Inside Dhaka label', $T()),
            Control::text('label_outside', 'Outside Dhaka label', $T()),
            Control::text('payment_note', 'Payment note', $T()),
            Control::text('submit_text', 'Button text', $T(['default' => 'Place Order'])),
            Control::textarea('success_message', 'Success message', ['section' => 'After order', 'rows' => 2, 'help' => 'Use {order} for the order number.']),
            Control::url('redirect_url', 'Redirect after order', ['section' => 'After order', 'help' => 'e.g. /checkout/success to reuse the shop\'s thank-you page.']),
            Control::text('notify_email', 'Notification email', ['section' => 'After order']),
            Control::switch('block_active_orders', 'Block a phone number that already has an active order', ['default' => true, 'section' => 'After order']),
        ], array_map(fn ($c) => $c + ['section' => 'Tracking'], $this->trackingControls('Purchase')));
    }

    protected function styleControls(): array
    {
        $S = fn (array $o = []) => $o + ['tab' => 'style', 'section' => 'Order form'];

        return [
            Control::text('max_width', 'Max width', $S(['responsive' => true, 'placeholder' => '980px'])),
            Control::color('accent', 'Accent color', $S()),
            Control::color('button_background', 'Button background', $S()),
            Control::color('button_color', 'Button text color', $S()),
            Control::text('field_radius', 'Field radius', $S(['placeholder' => '8px'])),
            Control::color('label_color', 'Label color', $S()),
        ];
    }

    protected function styleGroups(): array
    {
        return ['background', 'border', 'effects', 'color'];
    }

    // ------------------------------------------------------------------
    // Normalised configuration (used by the renderer AND the order service)
    // ------------------------------------------------------------------

    /** @return array<string,mixed> */
    public static function config(array $node): array
    {
        $c = $node['content'] ?? [];
        $items = [];
        $seen = [];
        foreach (array_slice((array) ($c['items'] ?? []), 0, 20) as $it) {
            $id = (int) ($it['product_id'] ?? 0);
            if (! is_array($it) || $id <= 0 || isset($seen[$id])) {
                continue;
            }
            $seen[$id] = true;
            $items[] = [
                'id' => $id,
                'label' => mb_substr((string) ($it['label'] ?? ''), 0, 120),
                'description' => mb_substr((string) ($it['description'] ?? ''), 0, 200),
                'selected' => ! empty($it['selected']),
                'qty' => max(1, min(50, (int) ($it['qty'] ?? 1))),
                'bump' => ! empty($it['bump']),
                'bump_text' => mb_substr((string) ($it['bump_text'] ?? ''), 0, 160),
            ];
        }

        if (empty($items) && ! empty($c['product_id'])) {
            $pid = (int) $c['product_id'];
            if ($pid > 0) {
                $items[] = [
                    'id' => $pid,
                    'label' => mb_substr((string) ($c['label'] ?? ''), 0, 120),
                    'description' => mb_substr((string) ($c['description'] ?? ''), 0, 200),
                    'selected' => true,
                    'qty' => 1,
                    'bump' => false,
                    'bump_text' => '',
                ];
            }
        }

        $fee = fn ($v) => ($v === null || $v === '' || ! is_numeric($v)) ? null : max(0, min(100000, (int) $v));

        return [
            'items' => $items,
            'mode' => isset(self::MODES[$c['mode'] ?? '']) ? $c['mode'] : 'single',
            'allow_qty' => ! array_key_exists('allow_qty', $c) || (bool) $c['allow_qty'],
            'show_email' => ! empty($c['show_email']),
            'show_notes' => ! empty($c['show_notes']),
            'fixed_fee' => [$fee($c['fee_inside'] ?? null), $fee($c['fee_outside'] ?? null)],
            'block_active_orders' => ! array_key_exists('block_active_orders', $c) || (bool) $c['block_active_orders'],
            'currency_symbol' => mb_substr((string) ($c['currency_symbol'] ?? '৳'), 0, 6),
        ];
    }

    /** Unit price after the product's percentage discount - same formula as the shop's cart. */
    public static function unitPrice(Product $p): int
    {
        $price = (float) $p->price;
        $discount = $p->discount ? (float) $p->discount : 0;

        return (int) round($price - ($price * ($discount / 100)));
    }

    /** Resolve the product's uploaded public image URL. */
    public static function formatImageUrl(?string $raw): ?string
    {
        if (! $raw) {
            return null;
        }
        $raw = trim($raw);
        if (str_starts_with($raw, 'http://') || str_starts_with($raw, 'https://') || str_starts_with($raw, '//')) {
            return $raw;
        }
        if (str_starts_with($raw, '/storage/')) {
            return $raw;
        }

        return '/storage/'.ltrim($raw, '/');
    }

    public static function productImageUrl(mixed $p): ?string
    {
        if (! $p) {
            return null;
        }
        if (is_string($p)) {
            return self::formatImageUrl($p);
        }
        $raw = (isset($p->image) && $p->image) ? $p->image : (isset($p->images) && $p->images ? $p->images->first()?->image_path : null);

        return self::formatImageUrl($raw);
    }

    // ------------------------------------------------------------------
    // Rendering
    // ------------------------------------------------------------------

    public function extraCss(array $node, string $root, RenderContext $ctx): string
    {
        $s = $node['settings'] ?? [];
        $accent = Sanitizer::color($s['accent'] ?? '') ?? '#16a34a';
        $css = $root.'{margin-left:auto;margin-right:auto;width:100%;box-sizing:border-box;--lp-of:'.$accent.'}'
            .$root.' .lp-of-grid{display:grid;gap:28px;grid-template-columns:1fr}'
            .'@media(min-width:900px){'.$root.' .lp-of-grid{grid-template-columns:1fr 1fr}}'
            .$root.' h3.lp-of-h{margin:0 0 14px;font-size:1.15em}'
            .$root.' .lp-field{margin-bottom:14px;display:flex;flex-direction:column;gap:6px;text-align:left}'
            .$root.' .lp-field label{font-weight:600;font-size:14px}'
            .$root.' .lp-input{font:inherit;padding:12px 14px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#111827;width:100%;box-sizing:border-box}'
            .$root.' .lp-input:focus{outline:2px solid var(--lp-of);outline-offset:1px}'
            .$root.' .lp-of-item{display:flex;gap:12px;align-items:center;padding:12px;border:2px solid #e5e7eb;border-radius:12px;margin-bottom:10px;cursor:pointer;background:#fff;color:#111827}'
            .$root.' .lp-of-item:has(input[name="pick[]"]:checked){border-color:var(--lp-of);background:color-mix(in srgb,var(--lp-of) 7%,#fff)}'
            .$root.' .lp-of-item.is-out{opacity:.5;cursor:not-allowed}'
            .$root.' .lp-of-item input[type=radio],'.$root.' .lp-of-item input[type=checkbox]{accent-color:var(--lp-of);width:18px;height:18px;flex:none}'
            .$root.' .lp-of-img{width:56px;height:56px;border-radius:8px;object-fit:cover;flex:none;background:#f3f4f6}'
            .$root.' .lp-of-info{flex:1;min-width:0}.lp-e-'.self::safeId($node['id']).' .lp-of-name{font-weight:600}'
            .$root.' .lp-of-desc{font-size:13px;opacity:.7}'
            .$root.' .lp-of-price{font-weight:700;white-space:nowrap;text-align:right}'
            .$root.' .lp-of-price s{display:block;font-weight:400;opacity:.5;font-size:12px}'
            .$root.' .lp-of-qty{width:64px;flex:none;padding:8px 6px;text-align:center}'
            .$root.' .lp-of-bump{border:2px dashed var(--lp-of);border-radius:12px;padding:12px;margin:0 0 12px;background:color-mix(in srgb,var(--lp-of) 6%,#fff);color:#111827}'
            .$root.' .lp-of-bump .lp-of-item{border:0;background:transparent;margin:0;padding:0}'
            .$root.' .lp-of-bumphead{font-weight:700;color:var(--lp-of);margin-bottom:6px}'
            .$root.' .lp-of-totals{border-top:1px solid #e5e7eb;margin-top:6px;padding-top:10px}'
            .$root.' .lp-of-row{display:flex;justify-content:space-between;padding:4px 0}'
            .$root.' .lp-of-row.is-total{font-weight:800;font-size:1.15em;border-top:2px solid #e5e7eb;margin-top:6px;padding-top:10px}'
            .$root.' .lp-of-pay{font-size:13px;margin:10px 0 14px;padding:10px 12px;border-radius:8px;background:#f3f4f6;color:#374151}'
            .$root.' .lp-fb{font:inherit;font-weight:700;cursor:pointer;border:0;border-radius:10px;padding:16px 20px;width:100%;background:var(--lp-of);color:#fff;font-size:1.05em}'
            .$root.' .lp-fb:disabled{opacity:.6;cursor:wait}'
            .$root.' .lp-hp{position:absolute!important;left:-9999px!important;height:0;overflow:hidden}'
            .$root.' .lp-form-msg{margin-top:12px;font-size:14px;min-height:1em}'
            .$root.' .lp-form-msg.is-error{color:#dc2626}'.$root.' .lp-form-msg.is-ok{color:#15803d;font-weight:600}'
            .$root.' .lp-err{color:#dc2626;font-size:13px}'
            .$root.' .lp-of-empty{padding:16px;border:2px dashed #d1d5db;border-radius:12px;text-align:center;color:#6b7280;font-size:14px}';
        if ($c = Sanitizer::color($s['button_background'] ?? '')) {
            $css .= $root.' .lp-fb{background:'.$c.'}';
        }
        if ($c = Sanitizer::color($s['button_color'] ?? '')) {
            $css .= $root.' .lp-fb{color:'.$c.'}';
        }
        if ($c = Sanitizer::color($s['label_color'] ?? '')) {
            $css .= $root.' .lp-field label,'.$root.' h3.lp-of-h{color:'.$c.'}';
        }
        if ($r = Sanitizer::length($s['field_radius'] ?? '')) {
            $css .= $root.' .lp-input{border-radius:'.$r.'}';
        }

        return $css;
    }

    public function render(array $node, string $children, RenderContext $ctx): string
    {
        $ctx->hasForm = true;
        $cfg = self::config($node);
        $c = $node['content'] ?? [];
        $sym = e($cfg['currency_symbol']);
        $t = fn (string $k, string $d) => e((string) ($c[$k] ?? '') !== '' ? (string) $c[$k] : $d);

        // If no products explicitly in order form, use page-level product
        if (empty($cfg['items']) && ! empty($ctx->settings['product_id'])) {
            $pid = (int) $ctx->settings['product_id'];
            if ($pid > 0) {
                $cfg['items'][] = [
                    'id' => $pid,
                    'label' => (string) ($ctx->settings['product_name'] ?? ''),
                    'description' => '',
                    'selected' => true,
                    'qty' => 1,
                    'bump' => false,
                    'bump_text' => '',
                ];
            }
        }

        $products = Product::with('images')->whereIn('id', array_column($cfg['items'], 'id'))->get()->keyBy('id');
        $rows = '';
        $bumps = '';
        $anyMain = false;
        $singleTaken = false; // radio group: only one option may start checked
        $initial = []; // pre-selected lines, for the initial (no-JS / editor) totals
        foreach ($cfg['items'] as $it) {
            $p = $products->get($it['id']);
            if (! $p) {
                continue; // product was deleted: never render an unorderable row
            }
            $price = self::unitPrice($p);
            $orig = (int) round((float) $p->price);
            $out = (int) $p->stock <= 0;
            $selected = ! $out && ($it['bump'] ? $it['selected'] : ($cfg['mode'] === 'fixed' ? true : $it['selected']));
            if ($selected && ! $it['bump'] && $cfg['mode'] === 'single') {
                $selected = ! $singleTaken;
                $singleTaken = true;
            }
            $type = ($it['bump'] || $cfg['mode'] !== 'single') ? 'checkbox' : 'radio';
            if ($selected || ($cfg['mode'] === 'fixed' && ! $it['bump'] && ! $out)) {
                $initial[] = ['price' => $price, 'quantity' => min($it['qty'], max(1, (int) $p->stock)), 'bussiness_class' => $p->bussiness_class];
            }
            $max = max(1, min(50, (int) $p->stock));
            $name = e($it['label'] !== '' ? $it['label'] : $p->name);
            $imgUrl = self::productImageUrl($p);
            $img = $imgUrl ? '<img class="lp-of-img" src="'.e($imgUrl).'" alt="'.e($p->name).'" loading="lazy" width="56" height="56">' : '';
            $locked = $cfg['mode'] === 'fixed' && ! $it['bump'];

            $box = '<label class="lp-of-item'.($out ? ' is-out' : '').'">'
                .'<input type="'.$type.'" name="pick[]" value="'.$p->id.'" data-price="'.$price.'" data-class="'.e(strtolower((string) $p->bussiness_class ?: 'normal')).'"'
                .($selected ? ' checked' : '').($out || $locked ? ' disabled' : '').'>'
                .$img
                .'<span class="lp-of-info"><span class="lp-of-name">'.$name.'</span>'
                .($it['description'] !== '' ? '<span class="lp-of-desc" style="display:block">'.e($it['description']).'</span>' : '')
                .($out ? '<span class="lp-of-desc" style="display:block;color:#dc2626">Out of stock</span>' : '').'</span>'
                .($cfg['allow_qty'] && ! $out ? '<input type="number" class="lp-input lp-of-qty" name="qty['.$p->id.']" min="1" max="'.$max.'" value="'.min($it['qty'], $max).'"'.($selected ? '' : ' disabled').' aria-label="Quantity">' : '')
                .'<span class="lp-of-price">'.($orig > $price ? '<s>'.$sym.number_format($orig).'</s>' : '').$sym.number_format($price).'</span></label>';

            if ($it['bump']) {
                $bumps .= '<div class="lp-of-bump"><div class="lp-of-bumphead">'.e($it['bump_text'] ?: 'Yes! Add this to my order').'</div>'.$box.'</div>';
            } else {
                $rows .= $box;
                $anyMain = true;
            }
        }
        if ($rows === '' && $bumps === '') {
            $rows = '<div class="lp-of-empty">'.($ctx->editing ? 'Add products in the Content tab to build your order form.' : 'This product is currently unavailable.').'</div>';
        }

        $sub0 = array_sum(array_map(fn ($l) => $l['price'] * $l['quantity'], $initial));
        $fee0 = $initial ? app(DeliveryFee::class)->calculate($initial, 'inside_dhaka', $cfg['fixed_fee']) : 0;

        $field = fn (string $id, string $label, string $control, string $err) => '<div class="lp-field"><label for="'.$id.'">'.$label.'</label>'.$control.'<span class="lp-err" data-err="'.$err.'"></span></div>';
        $fid = 'of_'.self::safeId($node['id']);
        $details = $field($fid.'_n', $t('label_name', 'Full name').' <span aria-hidden="true">*</span>', '<input class="lp-input" id="'.$fid.'_n" name="name" autocomplete="name" required>', 'name')
            .$field($fid.'_p', $t('label_phone', 'Mobile number').' <span aria-hidden="true">*</span>', '<input class="lp-input" id="'.$fid.'_p" name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="01XXXXXXXXX" required>', 'phone')
            .($cfg['show_email'] ? $field($fid.'_e', 'Email', '<input class="lp-input" id="'.$fid.'_e" name="email" type="email" autocomplete="email">', 'email') : '')
            .$field($fid.'_a', $t('label_address', 'Full address').' <span aria-hidden="true">*</span>', '<textarea class="lp-input" id="'.$fid.'_a" name="address" rows="3" autocomplete="street-address" required></textarea>', 'address')
            .$field($fid.'_d', $t('label_area', 'Delivery area').' <span aria-hidden="true">*</span>', '<select class="lp-input" id="'.$fid.'_d" name="delivery_area" required><option value="inside_dhaka">'.$t('label_inside', 'Inside Dhaka').'</option><option value="outside_dhaka">'.$t('label_outside', 'Outside Dhaka').'</option></select>', 'delivery_area')
            .($cfg['show_notes'] ? $field($fid.'_o', 'Order notes', '<textarea class="lp-input" id="'.$fid.'_o" name="notes" rows="2"></textarea>', 'notes') : '');

        $fees = json_encode(['t' => DeliveryFee::TABLE, 'fixed' => $cfg['fixed_fee'], 'sym' => $cfg['currency_symbol'], 'mode' => $cfg['mode']], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE);
        $hp = e(config('landing.forms.honeypot_field'));
        $attrs = ['class' => 'lp-form lp-order', 'method' => 'post', 'novalidate' => true, 'data-lp-form' => self::safeId($node['id']), 'data-lp-order' => $fees] + $this->trackAttrs($node, $ctx, 'submit');

        return $this->open($node, $ctx).'<form'.$this->attrs($attrs).'>'
            .'<div class="lp-hp" aria-hidden="true"><label>Leave this field empty<input type="text" name="'.$hp.'" tabindex="-1" autocomplete="off"></label></div>'
            .'<div class="lp-of-grid"><div><h3 class="lp-of-h">'.$t('heading_details', 'Billing details').'</h3>'.$details.'</div>'
            .'<div><h3 class="lp-of-h">'.$t('heading_order', 'Your order').'</h3>'.$rows.'<span class="lp-err" data-err="pick"></span>'.$bumps
            .'<div class="lp-of-totals"><div class="lp-of-row"><span>Subtotal</span><span data-of="subtotal">'.$sym.number_format($sub0).'</span></div>'
            .'<div class="lp-of-row"><span>Delivery</span><span data-of="delivery">'.$sym.number_format($fee0).'</span></div>'
            .'<div class="lp-of-row is-total"><span>Total</span><span data-of="total">'.$sym.number_format($sub0 + $fee0).'</span></div></div>'
            .'<div class="lp-of-pay">'.$t('payment_note', 'Cash on delivery - pay when you receive the product.').'</div>'
            .'<button type="submit" class="lp-fb" data-of-label="'.$t('submit_text', 'Place Order').'">'.$t('submit_text', 'Place Order').'</button>'
            .'<div class="lp-form-msg" role="status" aria-live="polite"></div></div></div></form></div>';
    }
}
