<?php

use App\Models\Category;
use App\Models\LandingPageEvent;
use App\Models\LandingPageLead;
use App\Models\Order;
use App\Models\Product;
use App\Services\DeliveryFee;
use Illuminate\Support\Facades\Http;

function lpProduct(array $attrs = []): Product
{
    $cat = Category::firstOrCreate(['name' => 'Order Cat']); // the DB is refreshed per test
    static $n = 0;
    $n++;

    return Product::create($attrs + [
        'category_id' => $cat->id, 'name' => "Widget {$n}", 'slug' => "widget-{$n}", 'price' => 1000, 'stock' => 10,
        'description' => 'd', 'quick_view' => 'q', 'bussiness_class' => 'normal',
    ]);
}

/** Publishes a page holding one order form. */
function lpOrderPage(array $items, array $content = [], string $slug = 'buy-now')
{
    $node = lpNode('order_form', array_merge([
        'items' => $items, 'mode' => 'single', 'allow_qty' => true, 'block_active_orders' => true,
        'success_message' => 'Order #{order} received', 'event_enabled' => true, 'event_name' => 'Purchase',
        'event_browser' => true, 'event_server' => true,
    ], $content), [], [], 'order_form_test01');

    return lpPublished(['slug' => $slug, 'content' => lpContent('Buy', [$node])]);
}

function lpItem(Product $p, array $extra = []): array
{
    return array_merge(['product_id' => $p->id, 'label' => '', 'selected' => true, 'qty' => 1, 'bump' => false], $extra);
}

function lpOrder($test, array $data = [], string $slug = 'buy-now')
{
    return $test->postJson("/_landing/{$slug}/submit", array_merge([
        'form' => 'order_form_test01', 'name' => 'Rahim Uddin', 'phone' => '01712345678',
        'address' => 'House 1, Road 2, Dhaka', 'delivery_area' => 'inside_dhaka',
    ], $data));
}

test('a visitor can place a real shop order from the landing page', function () {
    $p = lpProduct(['price' => 1000, 'stock' => 10]);
    lpOrderPage([lpItem($p)]);

    lpOrder($this, ['pick' => [$p->id], 'qty' => [$p->id => 2]])
        ->assertOk()->assertJsonPath('ok', true);

    $order = Order::with('items')->firstOrFail();
    expect($order->payment_method)->toBe('cod')
        ->and($order->order_status)->toBe('pending')
        ->and((float) $order->subtotal)->toBe(2000.0)
        ->and((float) $order->delivery_fee)->toBe(60.0)
        ->and((float) $order->grand_total)->toBe(2060.0)
        ->and($order->name)->toBe('Rahim Uddin')
        ->and($order->items)->toHaveCount(1)
        ->and($order->items[0]->quantity)->toBe(2)
        ->and((float) $order->items[0]->price)->toBe(1000.0)
        ->and($p->refresh()->stock)->toBe(8);

    // the customer also lands in the leads screen, marked converted
    $lead = LandingPageLead::firstOrFail();
    expect($lead->status)->toBe('converted')->and(collect($lead->data_json)->pluck('value')->implode(' '))->toContain('#'.$order->id);
});

test('the success message carries the order number and the shop thank-you page keeps working', function () {
    $p = lpProduct();
    lpOrderPage([lpItem($p)]);

    $res = lpOrder($this, ['pick' => [$p->id]])->assertOk();

    $order = Order::firstOrFail();
    expect($res->json('message'))->toBe("Order #{$order->id} received");
    $this->assertEquals($order->id, session('last_order_id'));
});

test('prices always come from the database and the discount is applied', function () {
    $p = lpProduct(['price' => 999, 'discount' => 10, 'stock' => 5]); // 999 - 99.9 = 899.1 -> 899
    lpOrderPage([lpItem($p)]);

    lpOrder($this, ['pick' => [$p->id], 'price' => 1, 'subtotal' => 1, 'grand_total' => 1, 'delivery_fee' => 0, 'prices' => [$p->id => 1]])->assertOk();

    $order = Order::firstOrFail();
    expect((float) $order->items->first()->price)->toBe(899.0)->and((float) $order->grand_total)->toBe(899.0 + 60.0);
});

test('only products configured on the published form can be ordered', function () {
    $listed = lpProduct();
    $other = lpProduct(['name' => 'Not on the page']);
    lpOrderPage([lpItem($listed)]);

    lpOrder($this, ['pick' => [$other->id]])->assertStatus(422)->assertJsonValidationErrors('pick');
    expect(Order::count())->toBe(0)->and($other->refresh()->stock)->toBe(10);
});

test('delivery fee follows the shop rules and can be overridden', function () {
    $high = lpProduct(['bussiness_class' => 'high']);
    lpOrderPage([lpItem($high)]);
    lpOrder($this, ['pick' => [$high->id], 'qty' => [$high->id => 2], 'delivery_area' => 'outside_dhaka'])->assertOk();
    expect((float) Order::first()->delivery_fee)->toBe(1000.0); // 2 x 500

    Order::query()->delete();
    $normal = lpProduct();
    lpOrderPage([lpItem($normal)], ['fee_inside' => '40', 'fee_outside' => '90'], 'flat-fee');
    lpOrder($this, ['pick' => [$normal->id], 'phone' => '01812345678'], 'flat-fee')->assertOk();
    expect((float) Order::first()->delivery_fee)->toBe(40.0);
});

test('delivery fee calculator matches the original checkout rules', function () {
    $f = new DeliveryFee;
    expect($f->calculate([['bussiness_class' => 'normal', 'quantity' => 3]], 'inside_dhaka'))->toBe(60)
        ->and($f->calculate([['bussiness_class' => 'normal', 'quantity' => 3]], 'outside_dhaka'))->toBe(120)
        ->and($f->calculate([['bussiness_class' => 'medium', 'quantity' => 2]], 'inside_dhaka'))->toBe(300)
        ->and($f->calculate([['bussiness_class' => 'medium', 'quantity' => 2]], 'outside_dhaka'))->toBe(500)
        ->and($f->calculate([['bussiness_class' => 'high', 'quantity' => 1], ['bussiness_class' => 'medium', 'quantity' => 4]], 'inside_dhaka'))->toBe(300);
});

test('order validation and stock protection', function () {
    $p = lpProduct(['stock' => 3]);
    $out = lpProduct(['stock' => 0]);
    lpOrderPage([lpItem($p), lpItem($out, ['selected' => false])]);

    lpOrder($this, ['pick' => [$p->id], 'phone' => '12345'])->assertStatus(422)->assertJsonValidationErrors('phone');
    lpOrder($this, ['pick' => [$p->id], 'name' => '', 'address' => ''])->assertStatus(422)->assertJsonValidationErrors(['name', 'address']);
    lpOrder($this, [])->assertStatus(422)->assertJsonValidationErrors('pick');
    lpOrder($this, ['pick' => [$p->id, $out->id]])->assertStatus(422)->assertJsonValidationErrors('pick'); // single mode
    lpOrder($this, ['pick' => [$out->id]])->assertStatus(422)->assertJsonValidationErrors('pick');            // out of stock
    lpOrder($this, ['pick' => [$p->id], 'qty' => [$p->id => 4]])->assertStatus(422)->assertJsonValidationErrors('pick'); // > stock
    lpOrder($this, ['pick' => [$p->id], 'qty' => [$p->id => 0]])->assertStatus(422)->assertJsonValidationErrors('pick');
    lpOrder($this, ['pick' => [$p->id], 'delivery_area' => 'mars'])->assertStatus(422)->assertJsonValidationErrors('delivery_area');

    expect(Order::count())->toBe(0)->and($p->refresh()->stock)->toBe(3);
});

test('a failed stock check can be retried and never oversells', function () {
    $p = lpProduct(['stock' => 1]);
    lpOrderPage([lpItem($p)]);

    lpOrder($this, ['pick' => [$p->id], 'qty' => [$p->id => 2]])->assertStatus(422);
    lpOrder($this, ['pick' => [$p->id], 'qty' => [$p->id => 1]])->assertOk();
    lpOrder($this, ['pick' => [$p->id], 'phone' => '01912345678'])->assertStatus(422); // now out of stock

    expect(Order::count())->toBe(1)->and($p->refresh()->stock)->toBe(0);
});

test('a phone number with an active order is blocked, unless the option is off', function () {
    $p = lpProduct();
    lpOrderPage([lpItem($p)]);
    Order::create(['name' => 'X', 'phone' => '01712345678', 'address' => 'a', 'subtotal' => 1, 'delivery_fee' => 0, 'grand_total' => 1, 'payment_method' => 'cod', 'payment_status' => 'pending', 'order_status' => 'processing']);

    lpOrder($this, ['pick' => [$p->id]])->assertStatus(422)->assertJsonValidationErrors('phone');
    expect(Order::count())->toBe(1);

    Order::query()->update(['order_status' => 'delivered']);
    lpOrder($this, ['pick' => [$p->id]])->assertOk();
    expect(Order::count())->toBe(2);
});

test('order bumps are optional and fixed bundles are always complete', function () {
    $main = lpProduct(['price' => 500]);
    $bump = lpProduct(['price' => 100]);
    lpOrderPage([lpItem($main), lpItem($bump, ['bump' => true, 'selected' => false])]);

    lpOrder($this, ['pick' => [$main->id, $bump->id]])->assertOk();
    expect(Order::first()->items)->toHaveCount(2);

    Order::query()->delete();
    $a = lpProduct(['price' => 100]);
    $b = lpProduct(['price' => 200]);
    lpOrderPage([lpItem($a), lpItem($b)], ['mode' => 'fixed'], 'bundle');
    lpOrder($this, ['phone' => '01812345678'], 'bundle')->assertOk(); // nothing picked: fixed mode includes both
    expect(Order::first()->items->pluck('product_id')->sort()->values()->all())->toBe(collect([$a->id, $b->id])->sort()->values()->all());
});

test('the honeypot drops bot orders', function () {
    $p = lpProduct();
    lpOrderPage([lpItem($p)]);

    lpOrder($this, ['pick' => [$p->id], 'website_url' => 'spam'])->assertOk();
    expect(Order::count())->toBe(0);
});

test('the purchase event carries value and the same event id to the browser and to Meta CAPI', function () {
    Http::fake(['graph.facebook.com/*' => Http::response(['events_received' => 1], 200)]);
    $p = lpProduct(['price' => 1000]);
    $page = lpOrderPage([lpItem($p)]);
    lpEnableCapi($page->refresh());

    $res = lpOrder($this, ['pick' => [$p->id], 'qty' => [$p->id => 2], 'event_id' => 'purch-0123456789'])->assertOk();

    $res->assertJsonPath('event.name', 'Purchase')->assertJsonPath('event.id', 'purch-0123456789')
        ->assertJsonPath('event.custom.value', 2060)->assertJsonPath('event.custom.currency', 'BDT')
        ->assertJsonPath('event.custom.num_items', 2);

    Http::assertSent(function ($r) {
        $e = $r['data'][0];
        $cd = (array) $e['custom_data']; // sent as a JSON object

        return $e['event_name'] === 'Purchase' && $e['event_id'] === 'purch-0123456789'
            && $cd['value'] == 2060 && $cd['currency'] === 'BDT'
            && $cd['contents'][0]['quantity'] == 2
            && $e['user_data']['ph'][0] === hash('sha256', '8801712345678')
            && ! str_contains(json_encode($e), '01712345678');
    });
    expect(LandingPageEvent::where('event_name', 'Purchase')->firstOrFail()->metadata_json['order_id'])->toBe(Order::first()->id);
});

test('a tracking or mail failure never loses the order', function () {
    Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('down'));
    $p = lpProduct();
    $page = lpOrderPage([lpItem($p)], ['notify_email' => 'shop@example.com']);
    lpEnableCapi($page->refresh());

    lpOrder($this, ['pick' => [$p->id]])->assertOk()->assertJsonPath('ok', true);
    expect(Order::count())->toBe(1);
});

test('the order form renders live products and hides unorderable ones', function () {
    $ok = lpProduct(['name' => 'Blue Bottle', 'price' => 1200, 'discount' => 25]);
    $out = lpProduct(['name' => 'Sold Out Thing', 'stock' => 0]);
    $gone = lpProduct(['name' => 'Deleted Thing']);
    lpOrderPage([lpItem($ok), lpItem($out), lpItem($gone)]);
    $gone->delete();

    \App\Services\Landing\LandingPageCache::flushAll();
    $html = $this->get('/buy-now')->assertOk()->getContent();

    expect($html)->toContain('Blue Bottle')->toContain('৳900')->toContain('৳1,200')
        ->toContain('Out of stock')->not->toContain('Deleted Thing')
        ->toContain('data-lp-order=')->toContain('name="pick[]"')->toContain('name="delivery_area"');
});

test('cached order pages refresh when a product price changes', function () {
    $p = lpProduct(['name' => 'Priced', 'price' => 500]);
    lpOrderPage([lpItem($p)]);

    $this->get('/buy-now')->assertSee('৳500', false);
    $p->update(['price' => 750]);
    $this->get('/buy-now')->assertSee('৳750', false)->assertDontSee('৳500', false);
});

test('publishing requires at least one valid product', function () {
    $admin = lpUser();
    $node = lpNode('order_form', ['items' => [['product_id' => 99999]]], [], [], 'order_form_test01');
    $page = lpPage(['slug' => 'empty-order', 'content' => lpContent('x', [$node])], $admin);

    $this->actingAs($admin)->postJson(route('admin.landing.publish', $page))->assertStatus(422)->assertJsonValidationErrors('publish');
});

test('the product picker endpoint is permission protected', function () {
    $p = lpProduct(['name' => 'Searchable Item', 'price' => 100, 'discount' => 50]);

    $this->getJson(route('admin.landing.products.search', ['q' => 'Searchable']))->assertUnauthorized();

    $res = $this->actingAs(lpUser())->getJson(route('admin.landing.products.search', ['q' => 'Searchable']))->assertOk();
    expect($res->json('0.id'))->toBe($p->id)->and($res->json('0.price'))->toBe(50);

    config(['landing.permissions.manager' => ['landing_pages.view']]);
    $this->actingAs(lpUser('manager'))->getJson(route('admin.landing.products.search', ['q' => 'x']))->assertForbidden();
});
