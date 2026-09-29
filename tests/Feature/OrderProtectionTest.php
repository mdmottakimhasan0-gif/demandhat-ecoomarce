<?php

use App\Models\BlockedOrderSource;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Services\OrderProtection;

function opProduct(int $stock = 20): Product
{
    $cat = Category::firstOrCreate(['name' => 'Protect Cat']);
    static $n = 0;
    $n++;

    return Product::create(['category_id' => $cat->id, 'name' => "Prot {$n}", 'slug' => "prot-{$n}", 'price' => 500, 'stock' => $stock, 'description' => 'd', 'quick_view' => 'q', 'bussiness_class' => 'normal']);
}

function opOrder(array $attrs = []): Order
{
    return Order::create($attrs + [
        'name' => 'X', 'phone' => '01711111111', 'address' => 'a', 'subtotal' => 1, 'delivery_fee' => 0, 'grand_total' => 1,
        'payment_method' => 'cod', 'payment_status' => 'pending', 'order_status' => 'pending', 'ip_address' => '198.51.100.9',
    ]);
}

function opSetting(array $over = []): void
{
    app(OrderProtection::class)->update(array_merge(['enabled' => true, 'block_phone' => true, 'block_ip' => false, 'ip_limit' => 3, 'window_hours' => 24], $over));
}

function opCheckout($test, string $phone = '01722222222', array $cart = null)
{
    $p = opProduct();

    return $test->withSession(['cart' => $cart ?? [$p->id => 1]])->post('/checkout', [
        'name' => 'Buyer', 'phone' => $phone, 'address' => 'Somewhere 12', 'delivery_area' => 'inside_dhaka',
    ]);
}

// ------------------------------------------------------------------ rules ----

test('by default a phone with an active order is blocked and one that was delivered is not', function () {
    $svc = app(OrderProtection::class);
    opOrder(['order_status' => 'processing']);

    expect($svc->check('01711111111', '1.1.1.1')['code'])->toBe('pending_order')
        ->and($svc->check('01799999999', '1.1.1.1'))->toBeNull();

    Order::query()->update(['order_status' => 'delivered']);
    expect($svc->check('01711111111', '1.1.1.1'))->toBeNull();
});

test('the master switch turns every rule off, including the block list', function () {
    $svc = app(OrderProtection::class);
    opOrder();
    BlockedOrderSource::create(['type' => 'phone', 'value' => '01733333333']);
    BlockedOrderSource::create(['type' => 'ip', 'value' => '203.0.113.7']);
    opSetting(['block_ip' => true, 'ip_limit' => 1]);

    expect($svc->check('01711111111', '198.51.100.9'))->not->toBeNull()
        ->and($svc->check('01733333333', '9.9.9.9'))->not->toBeNull();

    opSetting(['enabled' => false, 'block_ip' => true, 'ip_limit' => 1]);
    expect($svc->check('01711111111', '198.51.100.9'))->toBeNull()
        ->and($svc->check('01733333333', '203.0.113.7'))->toBeNull();
});

test('the phone rule can be switched off on its own', function () {
    opOrder();
    opSetting(['block_phone' => false]);

    expect(app(OrderProtection::class)->check('01711111111', '1.1.1.1'))->toBeNull();
});

test('the ip rule is off by default and blocks after the limit within the window', function () {
    $svc = app(OrderProtection::class);
    foreach (range(1, 3) as $i) {
        opOrder(['phone' => "0171000000{$i}", 'order_status' => 'delivered']);
    }
    expect($svc->check('01755555555', '198.51.100.9'))->toBeNull(); // default: ip rule off

    opSetting(['block_ip' => true, 'ip_limit' => 3, 'window_hours' => 24]);
    expect($svc->check('01755555555', '198.51.100.9')['code'])->toBe('ip_limit')
        ->and($svc->check('01755555555', '198.51.100.10'))->toBeNull(); // other ip is fine

    opSetting(['block_ip' => true, 'ip_limit' => 4]);
    expect($svc->check('01755555555', '198.51.100.9'))->toBeNull(); // below the limit
});

test('old orders and cancelled orders do not count towards the ip limit', function () {
    opSetting(['block_ip' => true, 'ip_limit' => 2, 'window_hours' => 24]);
    opOrder(['phone' => '01710000001', 'order_status' => 'delivered'])->forceFill(['created_at' => now()->subDays(3)])->save();
    opOrder(['phone' => '01710000002', 'order_status' => 'cancelled']);
    opOrder(['phone' => '01710000003', 'order_status' => 'delivered']);

    expect(app(OrderProtection::class)->check('01755555555', '198.51.100.9'))->toBeNull();
});

test('block list matches phone formats, exact ips and cidr ranges', function () {
    $svc = app(OrderProtection::class);
    BlockedOrderSource::create(['type' => 'phone', 'value' => '01733333333']);
    BlockedOrderSource::create(['type' => 'ip', 'value' => '203.0.113.7']);
    BlockedOrderSource::create(['type' => 'ip', 'value' => '192.0.2.0/24']);

    foreach (['01733333333', '+8801733333333', '8801733333333', '1733333333'] as $p) {
        expect($svc->check($p, '9.9.9.9')['code'])->toBe('blocked');
    }
    expect($svc->check('01744444444', '203.0.113.7')['code'])->toBe('blocked')
        ->and($svc->check('01744444444', '192.0.2.200')['code'])->toBe('blocked')
        ->and($svc->check('01744444444', '192.0.3.1'))->toBeNull()
        ->and($svc->check('01744444444', '203.0.113.8'))->toBeNull();
});

test('block list values are validated and normalised', function () {
    expect(OrderProtection::normalizeValue('phone', '+880 1733-333333'))->toBe('01733333333')
        ->and(OrderProtection::normalizeValue('phone', '12345'))->toBeNull()
        ->and(OrderProtection::normalizeValue('ip', '203.0.113.7'))->toBe('203.0.113.7')
        ->and(OrderProtection::normalizeValue('ip', '203.0.113.0/24'))->toBe('203.0.113.0/24')
        ->and(OrderProtection::normalizeValue('ip', '0.0.0.0/0'))->toBeNull()   // would block everybody
        ->and(OrderProtection::normalizeValue('ip', '10.0.0.0/4'))->toBeNull()
        ->and(OrderProtection::normalizeValue('ip', 'not-an-ip'))->toBeNull();
});

// ------------------------------------------------------------ admin screen ----

test('admins and managers can change the settings and manage the block list', function () {
    foreach (['admin', 'manager'] as $role) {
        $user = lpUser($role);

        $this->actingAs($user)->put('/admin/settings/order-protection', ['enabled' => false, 'block_phone' => true, 'block_ip' => true, 'ip_limit' => 5, 'window_hours' => 12])
            ->assertRedirect();
        expect(app(OrderProtection::class)->settings())->toBe(['enabled' => false, 'block_phone' => true, 'block_ip' => true, 'ip_limit' => 5, 'window_hours' => 12]);

        $this->actingAs($user)->post('/admin/settings/order-protection/blocked', ['type' => 'phone', 'value' => '+8801766666666', 'reason' => 'fake orders'])->assertSessionHasNoErrors();
        $row = BlockedOrderSource::where('value', '01766666666')->firstOrFail();
        expect($row->reason)->toBe('fake orders')->and($row->created_by)->toBe($user->id);

        $this->actingAs($user)->post('/admin/settings/order-protection/blocked', ['type' => 'phone', 'value' => '01766666666'])->assertSessionHasErrors('value'); // duplicate
        $this->actingAs($user)->delete("/admin/settings/order-protection/blocked/{$row->id}")->assertRedirect();
        expect(BlockedOrderSource::count())->toBe(0);
    }
});

test('invalid values and out of range settings are rejected', function () {
    $admin = lpUser();

    $this->actingAs($admin)->post('/admin/settings/order-protection/blocked', ['type' => 'ip', 'value' => '0.0.0.0/0'])->assertSessionHasErrors('value');
    $this->actingAs($admin)->post('/admin/settings/order-protection/blocked', ['type' => 'phone', 'value' => 'abc'])->assertSessionHasErrors('value');
    $this->actingAs($admin)->put('/admin/settings/order-protection', ['enabled' => true, 'block_phone' => true, 'block_ip' => true, 'ip_limit' => 0, 'window_hours' => 9999])
        ->assertSessionHasErrors(['ip_limit', 'window_hours']);
});

test('only management roles can reach the protection endpoints', function () {
    $this->put('/admin/settings/order-protection', [])->assertRedirect('/login');
    $this->actingAs(lpUser('customer'))->put('/admin/settings/order-protection', [])->assertRedirect('/dashboard');
    $this->actingAs(lpUser('employee'))->post('/admin/settings/order-protection/blocked', ['type' => 'phone', 'value' => '01711111111'])->assertForbidden();
});

test('the settings page receives the protection data', function () {
    BlockedOrderSource::create(['type' => 'ip', 'value' => '203.0.113.7', 'reason' => 'spam']);

    $props = $this->actingAs(lpUser())->get('/admin/settings')->assertOk()->viewData('page')['props'];

    expect($props['orderProtection']['ready'])->toBeTrue()
        ->and($props['orderProtection']['settings']['enabled'])->toBeTrue()
        ->and($props['orderProtection']['blocked'][0]['value'])->toBe('203.0.113.7');
});

// ------------------------------------------------------ shop checkout wiring ----

test('the website checkout stores the buyer ip and still works normally', function () {
    opCheckout($this)->assertRedirect(route('checkout.success'));

    expect(Order::first()->ip_address)->toBe('127.0.0.1');
});

test('the website checkout is blocked by phone, by ip limit and by the block list', function () {
    opOrder(['phone' => '01722222222', 'order_status' => 'processing']);
    opCheckout($this)->assertSessionHasErrors('pending_order'); // existing popup key

    Order::query()->delete();
    BlockedOrderSource::create(['type' => 'ip', 'value' => '127.0.0.1']);
    opCheckout($this)->assertSessionHasErrors('error');
    expect(Order::count())->toBe(0);

    BlockedOrderSource::query()->delete();
    \Illuminate\Support\Facades\Cache::forget('order_protection.blocklist'); // mass delete fires no model events
    opSetting(['block_ip' => true, 'ip_limit' => 1]);
    opCheckout($this, '01733333331')->assertRedirect(route('checkout.success'));
    opCheckout($this, '01733333332')->assertSessionHasErrors('error');
    expect(Order::count())->toBe(1);
});

test('switching protection off lets duplicate orders through the website checkout', function () {
    opOrder(['phone' => '01722222222', 'order_status' => 'processing']);
    opSetting(['enabled' => false]);

    opCheckout($this)->assertRedirect(route('checkout.success'));
    expect(Order::count())->toBe(2);
});

// ---------------------------------------------------- landing order wiring ----

test('the landing order form obeys the same protection settings', function () {
    $p = lpProduct();
    lpOrderPage([lpItem($p)]);
    BlockedOrderSource::create(['type' => 'phone', 'value' => '01712345678']);

    lpOrder($this, ['pick' => [$p->id]])->assertStatus(422)->assertJsonValidationErrors('pick');
    expect(Order::count())->toBe(0);

    BlockedOrderSource::query()->delete();
    \Illuminate\Support\Facades\Cache::forget('order_protection.blocklist'); // mass delete fires no model events
    opSetting(['block_ip' => true, 'ip_limit' => 1]);
    lpOrder($this, ['pick' => [$p->id]])->assertOk();
    expect(Order::first()->ip_address)->toBe('127.0.0.1');

    lpOrder($this, ['pick' => [$p->id], 'phone' => '01812345678'])->assertStatus(422)->assertJsonValidationErrors('pick'); // ip limit

    opSetting(['enabled' => false]);
    lpOrder($this, ['pick' => [$p->id], 'phone' => '01812345678'])->assertOk();
    expect(Order::count())->toBe(2);
});
