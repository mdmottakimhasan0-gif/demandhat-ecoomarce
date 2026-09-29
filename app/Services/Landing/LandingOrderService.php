<?php

namespace App\Services\Landing;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\Elements\OrderFormElement;
use App\Landing\Support\Sanitizer;
use App\Mail\LandingLeadReceived;
use App\Models\LandingPage;
use App\Models\LandingPageVersion;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\DeliveryFee;
use App\Services\OrderProtection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Places a real shop Order from a landing page order form (COD, guest checkout).
 * Which products can be ordered comes from the PUBLISHED page; prices, stock and delivery
 * fees come from the database. The browser only says which of those products and how many.
 */
class LandingOrderService
{
    public function __construct(
        private LeadRecorder $recorder,
        private LandingPageTrackingService $tracking,
        private DeliveryFee $fees,
        private OrderProtection $protection,
    ) {}

    public function submit(LandingPage $page, LandingPageVersion $version, array $node, Request $request): array
    {
        $cfg = OrderFormElement::config($node);
        $content = $node['content'] ?? [];

        // If no products in config, fallback to page/version settings product_id
        if (empty($cfg['items'])) {
            $settings = $version->settings_json ?? [];
            if (! empty($settings['product_id'])) {
                $cfg['items'] = [[
                    'id' => (int) $settings['product_id'],
                    'label' => (string) ($settings['product_name'] ?? ''),
                    'description' => '',
                    'selected' => true,
                    'qty' => 1,
                    'bump' => false,
                    'bump_text' => '',
                ]];
            }
        }

        // Honeypot: pretend it worked.
        if (filled($request->input(config('landing.forms.honeypot_field')))) {
            return ['ok' => true, 'message' => 'Thank you!', 'redirect' => null, 'event' => null];
        }

        $raw = $request->all();
        $name = $raw['name'] ?? $raw['customer_name'] ?? $raw['billing_name'] ?? $raw['fullname'] ?? $raw['cName'] ?? null;
        $phone = $raw['phone'] ?? $raw['customer_phone'] ?? $raw['mobile'] ?? $raw['phone_number'] ?? $raw['cPhone'] ?? null;
        if ($phone) {
            $phone = preg_replace('/[^0-9]/', '', (string) $phone);
            if (str_starts_with($phone, '8801')) {
                $phone = substr($phone, 2);
            }
        }
        $address = $raw['address'] ?? $raw['customer_address'] ?? $raw['full_address'] ?? $raw['cAddress'] ?? null;

        if ($name && $address && $name === $address) {
            if (! empty($raw['cName']) && $raw['cName'] !== $address) {
                $name = $raw['cName'];
            } elseif (! empty($raw['cAddress']) && $raw['cAddress'] !== $name) {
                $address = $raw['cAddress'];
            }
        }
        $area = $raw['delivery_area'] ?? $raw['delivery_zone'] ?? $raw['area'] ?? $raw['delivery'] ?? null;
        if ($area !== null && $area !== 'inside_dhaka' && $area !== 'outside_dhaka') {
            $areaStr = strtolower(trim((string) $area));
            if (str_contains($areaStr, 'outside') || str_contains($areaStr, 'বাইরে') || str_contains($areaStr, '120')) {
                $area = 'outside_dhaka';
            } elseif (str_contains($areaStr, 'inside') || str_contains($areaStr, 'মধ্যে') || str_contains($areaStr, 'ভেতরে') || str_contains($areaStr, '60')) {
                $area = 'inside_dhaka';
            }
        }
        $area ??= 'inside_dhaka';

        $raw['name'] = $name !== null ? trim((string) $name) : '';
        $raw['phone'] = $phone !== null ? trim((string) $phone) : '';
        $raw['address'] = $address !== null ? trim((string) $address) : '';
        $raw['delivery_area'] = $area;

        $data = Validator::make($raw, [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'regex:/^(013|014|015|016|017|018|019)[0-9]{8}$/'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['required', 'string', 'max:500'],
            'delivery_area' => ['required', 'in:inside_dhaka,outside_dhaka'],
            'notes' => ['nullable', 'string', 'max:500'],
            'pick' => ['nullable', 'array'],
            'pick.*' => ['integer'],
            'qty' => ['nullable', 'array'],
        ], [
            'phone.regex' => 'Enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).',
        ])->validate();

        $lines = $this->resolveLines($cfg, (array) ($data['pick'] ?? []), (array) ($data['qty'] ?? []));

        // Same duplicate-order protection as the shop checkout (Admin > Settings > Order Protection).
        $blocked = $this->protection->check($data['phone'], $request->ip(), skipPhoneRule: ! $cfg['block_active_orders']);
        if ($blocked) {
            throw ValidationException::withMessages([$blocked['code'] === 'pending_order' ? 'phone' : 'pick' => $blocked['message']]);
        }

        // Double-click / repeated submit guard.
        $lockKey = 'landing:order:'.hash('sha256', $page->id.'|'.$node['id'].'|'.$data['phone']);
        if (! Cache::add($lockKey, 1, (int) config('landing.forms.duplicate_window_seconds'))) {
            throw ValidationException::withMessages(['phone' => 'Your order was just received. Please wait a moment before ordering again.']);
        }

        try {
            [$order, $totals, $items] = $this->createOrder($data, $lines, $cfg, $request->ip());
        } catch (\Throwable $e) {
            Cache::forget($lockKey); // allow a retry after a stock error
            throw $e;
        }

        // Keep the shop's own thank-you page working when the visitor is redirected there.
        if ($request->hasSession()) {
            $request->session()->put('last_order_id', $order->id);
        }

        // ---- best effort from here: the order is saved ----
        $rows = $this->leadRows($data, $order, $items, $totals);
        $this->recorder->record($page, AbstractElement::safeId($node['id']), $request, $data['name'], $data['email'] ?? null, $data['phone'], $rows, 'converted');

        $custom = [
            'value' => (float) $totals['grand'],
            'currency' => 'BDT',
            'content_type' => 'product',
            'num_items' => array_sum(array_column($items, 'quantity')),
            'contents' => array_map(fn ($i) => ['id' => (string) $i['id'], 'quantity' => (int) $i['quantity'], 'item_price' => (float) $i['price']], $items),
        ];
        $event = $this->tracking->submission(
            $page, $version, AbstractElement::trackingConfig($node, 'submit'), $request,
            ['email' => $data['email'] ?? null, 'phone' => '88'.$data['phone'], 'name' => $data['name']], // Meta wants the country code (BD: 880...)
            $custom, ['order_id' => $order->id, 'value' => $totals['grand']],
        );

        $this->afterOrder($content, $page, $rows);

        return [
            'ok' => true,
            'message' => str_replace('{order}', (string) $order->id, (string) (($content['success_message'] ?? '') ?: 'Thank you! Your order #{order} has been placed.')),
            'redirect' => Sanitizer::url($content['redirect_url'] ?? '') ?: null,
            'event' => $event,
        ];
    }

    /**
     * Turn "which ids/quantities the browser sent" into validated order lines.
     * Only products configured on the published form can ever be ordered.
     *
     * @return list<array{product:Product,quantity:int}>
     */
    private function resolveLines(array $cfg, array $pick, array $qty): array
    {
        $configured = collect($cfg['items'])->keyBy('id');
        $main = $configured->where('bump', false);

        if (! empty($pick)) {
            foreach ($pick as $id) {
                if (! $configured->has((int) $id)) {
                    throw ValidationException::withMessages(['pick' => 'A selected product is not available on this page.']);
                }
            }
        }

        $picked = collect($pick)->map(fn ($v) => (int) $v)->unique()->filter(fn ($id) => $configured->has($id));
        if ($picked->isEmpty() && empty($pick) && $main->count() === 1) {
            $picked = $main->keys();
        }

        $wanted = match ($cfg['mode']) {
            'fixed' => $main->keys()->merge($picked->filter(fn ($id) => $configured[$id]['bump'])),
            default => $picked,
        };
        $wanted = $wanted->unique()->values();

        if ($wanted->isEmpty() && $main->count() === 1) {
            $wanted = collect([$main->keys()->first()]);
        }

        $mainPicked = $wanted->filter(fn ($id) => ! $configured[$id]['bump']);
        if ($cfg['mode'] === 'single' && $mainPicked->count() > 1) {
            throw ValidationException::withMessages(['pick' => 'Please choose only one product.']);
        }
        if ($wanted->isEmpty()) {
            throw ValidationException::withMessages(['pick' => 'Please select a product to order.']);
        }

        $products = Product::whereIn('id', $wanted)->get()->keyBy('id');
        $lines = [];
        foreach ($wanted as $id) {
            $product = $products->get($id);
            if (! $product) {
                throw ValidationException::withMessages(['pick' => 'A selected product is no longer available.']);
            }
            $q = $cfg['allow_qty'] ? (int) ($qty[$id] ?? $configured[$id]['qty']) : $configured[$id]['qty'];
            if ($q < 1 || $q > 50) {
                throw ValidationException::withMessages(['pick' => 'Invalid quantity.']);
            }
            $lines[] = ['product' => $product, 'quantity' => $q];
        }

        return $lines;
    }

    /** @return array{0:Order,1:array{subtotal:int,delivery:int,grand:int},2:list<array>} */
    private function createOrder(array $data, array $lines, array $cfg, ?string $ip): array
    {
        return DB::transaction(function () use ($data, $lines, $cfg, $ip) {
            $items = [];
            $models = [];
            $subtotal = 0;
            foreach ($lines as $line) {
                // Lock the row so two simultaneous orders cannot oversell the last unit.
                $product = Product::lockForUpdate()->find($line['product']->id);
                if (! $product || $product->stock < $line['quantity']) {
                    throw ValidationException::withMessages(['pick' => "'".($product->name ?? 'A product')."' is out of stock."]);
                }
                $price = OrderFormElement::unitPrice($product);
                $subtotal += $price * $line['quantity'];
                $items[] = ['id' => $product->id, 'name' => $product->name, 'price' => $price, 'quantity' => $line['quantity'], 'bussiness_class' => $product->bussiness_class];
                $models[$product->id] = $product;
            }

            $delivery = $this->fees->calculate($items, $data['delivery_area'], $cfg['fixed_fee']);
            $grand = $subtotal + $delivery;

            $order = Order::create([
                'user_id' => null,
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'],
            ] + OrderProtection::orderIp($ip) + [
                'address' => $data['address'].(! empty($data['notes']) ? "\nNote: ".$data['notes'] : ''),
                'subtotal' => $subtotal,
                'delivery_fee' => $delivery,
                'grand_total' => $grand,
                'payment_method' => 'cod',
                'payment_status' => 'pending',
                'order_status' => 'pending',
            ]);

            foreach ($items as $i) {
                OrderItem::create(['order_id' => $order->id, 'product_id' => $i['id'], 'product_name' => $i['name'], 'price' => $i['price'], 'quantity' => $i['quantity']]);
                $models[$i['id']]->decrement('stock', $i['quantity']);
            }

            return [$order, ['subtotal' => $subtotal, 'delivery' => $delivery, 'grand' => $grand], $items];
        });
    }

    private function leadRows(array $data, Order $order, array $items, array $totals): array
    {
        $rows = [
            ['name' => 'order', 'label' => 'Order', 'type' => 'text', 'value' => '#'.$order->id],
            ['name' => 'name', 'label' => 'Name', 'type' => 'name', 'value' => $data['name']],
            ['name' => 'phone', 'label' => 'Phone', 'type' => 'phone', 'value' => $data['phone']],
            ['name' => 'address', 'label' => 'Address', 'type' => 'text', 'value' => $data['address']],
            ['name' => 'delivery_area', 'label' => 'Delivery area', 'type' => 'text', 'value' => $data['delivery_area'] === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'],
            ['name' => 'items', 'label' => 'Items', 'type' => 'text', 'value' => implode(', ', array_map(fn ($i) => $i['name'].' x'.$i['quantity'], $items))],
            ['name' => 'total', 'label' => 'Total (incl. delivery)', 'type' => 'number', 'value' => (string) $totals['grand']],
        ];
        if (! empty($data['email'])) {
            $rows[] = ['name' => 'email', 'label' => 'Email', 'type' => 'email', 'value' => $data['email']];
        }

        return $rows;
    }

    private function afterOrder(array $content, LandingPage $page, array $rows): void
    {
        try {
            // Prices/stock are baked into the cached page: refresh so "out of stock" shows quickly.
            LandingPageCache::flushAll();

            $to = (string) ($content['notify_email'] ?? '');
            if ($to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL)) {
                Mail::to($to)->send(new LandingLeadReceived($page->title, $page->publicUrl(), array_map(fn ($r) => ['label' => $r['label'], 'value' => $r['value']], $rows)));
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
