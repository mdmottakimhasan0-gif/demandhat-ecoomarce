<?php

use App\Models\LandingPage;
use App\Models\LandingPageEvent;
use App\Models\LandingPageLead;
use App\Models\LandingPageSetting;
use App\Services\Landing\LandingPageEventService;
use App\Services\Landing\MetaConversionsApiService;
use App\Services\Landing\TrackingConfig;
use Illuminate\Support\Facades\Http;

// ------------------------------------------------------------------ forms ----

test('a visitor can submit the form and a lead is stored with hashed ip only', function () {
    lpPublished(['slug' => 'lead-page']);

    lpSubmit($this, 'lead-page')->assertOk()->assertJsonPath('ok', true)->assertJsonPath('message', 'Thanks a lot!');

    $lead = LandingPageLead::firstOrFail();
    expect($lead->name)->toBe('Jane Doe')
        ->and($lead->email)->toBe('jane@example.com')
        ->and($lead->status)->toBe('new')
        ->and($lead->form_id)->toBe('form_testform01')
        ->and($lead->ip_hash)->toHaveLength(64)
        ->and($lead->ip_hash)->not->toBe('127.0.0.1')
        ->and(collect($lead->data_json)->pluck('label')->all())->toContain('Name', 'Email');
});

test('form validation errors are returned per field', function () {
    lpPublished(['slug' => 'lead-page']);

    lpSubmit($this, 'lead-page', ['email' => 'not-an-email', 'name' => ''])
        ->assertStatus(422)->assertJsonValidationErrors(['email', 'name']);

    expect(LandingPageLead::count())->toBe(0);
});

test('the honeypot silently drops bot submissions', function () {
    lpPublished(['slug' => 'lead-page']);

    lpSubmit($this, 'lead-page', ['website_url' => 'http://spam'])->assertOk()->assertJsonPath('ok', true);

    expect(LandingPageLead::count())->toBe(0);
});

test('duplicate submissions inside the window create a single lead', function () {
    lpPublished(['slug' => 'lead-page']);

    lpSubmit($this, 'lead-page')->assertOk();
    lpSubmit($this, 'lead-page')->assertOk();

    expect(LandingPageLead::count())->toBe(1);
});

test('the form definition comes from the published page, not the request', function () {
    lpPublished(['slug' => 'lead-page']);

    // an unknown form id cannot be used to inject leads
    lpSubmit($this, 'lead-page', ['form' => 'form_nope'])->assertNotFound();
    // unpublished/unknown page
    lpSubmit($this, 'missing-page')->assertNotFound();
    // undeclared fields are ignored
    lpSubmit($this, 'lead-page', ['admin' => 'true', 'status' => 'converted'])->assertOk();
    expect(LandingPageLead::first()->status)->toBe('new');
});

test('draft pages cannot receive submissions', function () {
    lpPage(['slug' => 'draft-form']);

    lpSubmit($this, 'draft-form')->assertNotFound();
});

test('form submissions are rate limited', function () {
    lpPublished(['slug' => 'lead-page']);

    foreach (range(1, 10) as $i) {
        lpSubmit($this, 'lead-page', ['email' => "u{$i}@example.com"])->assertOk();
    }
    lpSubmit($this, 'lead-page', ['email' => 'u11@example.com'])->assertStatus(429);
});

// ------------------------------------------------------------------- UTM ----

test('utm parameters and referrer are captured in the session on page load', function () {
    lpPublished(['slug' => 'usa-offer']);

    $this->get('/usa-offer?utm_source=facebook&utm_medium=paid&utm_campaign=usa_offer&utm_term=leads&utm_content=ad1', ['Referer' => 'https://l.facebook.com/x'])
        ->assertOk()
        ->assertSessionHas('lp_attribution.utm.utm_source', 'facebook')
        ->assertSessionHas('lp_attribution.utm.utm_campaign', 'usa_offer')
        ->assertSessionHas('lp_attribution.referrer', 'https://l.facebook.com/x');
});

test('attribution from the session is attached to the lead', function () {
    lpPublished(['slug' => 'usa-offer']);

    $this->withSession(['lp_attribution' => [
        'utm' => ['utm_source' => 'facebook', 'utm_medium' => 'paid', 'utm_campaign' => 'usa_offer', 'utm_term' => 'kw', 'utm_content' => 'ad1'],
        'referrer' => 'https://l.facebook.com/x',
        'landing_url' => 'https://site.test/usa-offer?utm_source=facebook',
    ]]);
    lpSubmit($this, 'usa-offer')->assertOk();

    $lead = LandingPageLead::firstOrFail();
    expect($lead->utm_source)->toBe('facebook')->and($lead->utm_medium)->toBe('paid')
        ->and($lead->utm_campaign)->toBe('usa_offer')->and($lead->utm_term)->toBe('kw')->and($lead->utm_content)->toBe('ad1')
        ->and($lead->referrer)->toBe('https://l.facebook.com/x')->and($lead->landing_url)->toContain('/usa-offer')
        ->and($lead->source)->toBe('facebook');
});

test('utm values echoed by the browser are used when the session has none', function () {
    lpPublished(['slug' => 'usa-offer']);

    lpSubmit($this, 'usa-offer', ['utm_source' => 'google', 'utm_campaign' => 'brand', 'landing_url' => 'https://site.test/usa-offer'])->assertOk();

    expect(LandingPageLead::first())->utm_source->toBe('google')->utm_campaign->toBe('brand');
});

// ----------------------------------------------------- tracking + dedupe ----

test('tracking configuration is normalised and secrets stay out of it', function () {
    $t = TrackingConfig::normalize([
        'meta' => ['pixel_id' => '12ab34', 'events' => ['Purchase' => 1, 'Bogus' => true]],
        'capi' => ['api_version' => 'evil', 'test_event_code' => 'TE ST<script>'],
    ]);

    expect($t['meta']['pixel_id'])->toBe('1234')
        ->and($t['meta']['events']['Purchase'])->toBeTrue()
        ->and($t['meta']['events'])->not->toHaveKey('Bogus')
        ->and($t['capi']['api_version'])->toBe('')
        ->and($t['capi']['test_event_code'])->toBe('TESTscript')
        ->and(json_encode($t))->not->toContain('access_token');
});

test('event ids are uuids and browser supplied ids are validated', function () {
    expect(LandingPageEventService::newEventId())->toMatch('/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/')
        ->and(LandingPageEventService::acceptOrNewEventId('abc-12345678'))->toBe('abc-12345678')
        ->and(LandingPageEventService::acceptOrNewEventId('<script>'))->toMatch('/^[0-9a-f-]{36}$/')
        ->and(LandingPageEventService::acceptOrNewEventId(null))->toMatch('/^[0-9a-f-]{36}$/');
});

test('the same event id is used by the browser pixel and the server capi call', function () {
    Http::fake(['graph.facebook.com/*' => Http::response(['events_received' => 1], 200)]);
    lpEnableCapi(lpPage(['slug' => 'capi-page']));

    $eventId = 'evt-0123456789abcdef';
    $res = lpSubmit($this, 'capi-page', ['event_id' => $eventId])->assertOk();

    // browser gets the id to pass as fbq eventID
    $res->assertJsonPath('event.name', 'Lead')->assertJsonPath('event.id', $eventId)->assertJsonPath('event.browser', true);

    // server sent exactly the same id, hashed pii and the test event code
    Http::assertSent(function ($request) use ($eventId) {
        $e = $request['data'][0];

        return str_contains($request->url(), '/111222333/events')
            && $e['event_name'] === 'Lead'
            && $e['event_id'] === $eventId
            && $e['action_source'] === 'website'
            && $e['user_data']['em'][0] === hash('sha256', 'jane@example.com')
            && ! str_contains(json_encode($e), 'jane@example.com')
            && $request['test_event_code'] === 'TEST123';
    });

    $event = LandingPageEvent::where('event_id', $eventId)->firstOrFail();
    expect($event->deliveries->pluck('status', 'channel')->all())->toBe(['browser' => 'sent', 'capi' => 'sent']);
});

test('page view fires capi with the same id that is embedded for the browser pixel', function () {
    Http::fake(['graph.facebook.com/*' => Http::response(['events_received' => 1], 200)]);
    lpEnableCapi(lpPage(['slug' => 'pv-page']));

    $html = $this->get('/pv-page')->assertOk()->getContent();

    $event = LandingPageEvent::where('event_name', 'PageView')->firstOrFail();
    expect($html)->toContain($event->event_id);
    Http::assertSent(fn ($r) => $r['data'][0]['event_name'] === 'PageView' && $r['data'][0]['event_id'] === $event->event_id);
});

test('a capi failure never breaks the lead or the page', function () {
    Http::fake(['graph.facebook.com/*' => Http::response(['error' => ['message' => 'Invalid OAuth access token.']], 400)]);
    lpEnableCapi(lpPage(['slug' => 'fail-page']));

    lpSubmit($this, 'fail-page')->assertOk()->assertJsonPath('ok', true);
    $this->get('/fail-page')->assertOk();

    expect(LandingPageLead::count())->toBe(1);
    $delivery = \App\Models\LandingPageEventDelivery::where('channel', 'capi')->where('status', 'failed')->first();
    expect($delivery)->not->toBeNull()->and($delivery->response_code)->toBe(400)->and($delivery->error_message)->toContain('Invalid OAuth');
});

test('a capi connection error is isolated from the visitor', function () {
    Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('timeout'));
    lpEnableCapi(lpPage(['slug' => 'down-page']));

    lpSubmit($this, 'down-page')->assertOk();
    expect(LandingPageLead::count())->toBe(1);
});

test('capi is skipped and recorded when disabled for the page', function () {
    Http::fake();
    lpPublished(['slug' => 'no-capi']);

    lpSubmit($this, 'no-capi')->assertOk();

    Http::assertNothingSent();
    expect(\App\Models\LandingPageEventDelivery::where('channel', 'capi')->first()->status)->toBe('skipped');
});

test('button click events come from the published page config only', function () {
    Http::fake(['graph.facebook.com/*' => Http::response([], 200)]);
    lpEnableCapi(lpPage(['slug' => 'click-page']));

    $this->postJson('/_landing/click-page/track', ['kind' => 'click', 'element' => 'button_testbtn001', 'event_id' => 'click-evt-0001'])->assertNoContent();
    // visitors cannot invent events for elements that are not tracked
    $this->postJson('/_landing/click-page/track', ['kind' => 'click', 'element' => 'heading_testhead01', 'event_id' => 'click-evt-0002'])->assertNoContent();
    $this->postJson('/_landing/click-page/track', ['kind' => 'click', 'element' => 'nonexistent', 'event_id' => 'click-evt-0003'])->assertNoContent();

    expect(LandingPageEvent::where('source', 'click')->pluck('event_name', 'event_id')->all())->toBe(['click-evt-0001' => 'Contact']);
    Http::assertSent(fn ($r) => $r['data'][0]['event_name'] === 'Contact' && $r['data'][0]['event_id'] === 'click-evt-0001');

    // a repeated beacon with the same id is not double counted
    $this->postJson('/_landing/click-page/track', ['kind' => 'click', 'element' => 'button_testbtn001', 'event_id' => 'click-evt-0001'])->assertNoContent();
    expect(LandingPageEvent::where('source', 'click')->count())->toBe(1);
});

test('meta hashing follows the normalisation rules', function () {
    $u = MetaConversionsApiService::hashUserData(['email' => '  Jane@Example.COM ', 'phone' => '+1 (555) 123-4567', 'name' => 'Jane Doe', 'client_ip_address' => '1.2.3.4', 'fbp' => 'fb.1.1.2']);

    expect($u['em'])->toBe([hash('sha256', 'jane@example.com')])
        ->and($u['ph'])->toBe([hash('sha256', '15551234567')])
        ->and($u['fn'])->toBe([hash('sha256', 'jane')])
        ->and($u['ln'])->toBe([hash('sha256', 'doe')])
        ->and($u['client_ip_address'])->toBe('1.2.3.4')
        ->and($u['fbp'])->toBe('fb.1.1.2');
});

// ---------------------------------------------------------------- secrets ----

test('capi credentials are never exposed to the browser or stored in clear text', function () {
    $admin = lpUser();
    $token = 'EAAB-super-secret-token-value';
    $page = lpPage(['slug' => 'secret-page'], $admin);

    $this->actingAs($admin)->putJson(route('admin.landing.tracking.update', $page), [
        'tracking' => ['meta' => ['use_global' => false, 'pixel_id' => '999888777'], 'capi' => ['enabled' => true, 'use_global' => false]],
        'capi_access_token' => $token,
    ])->assertOk()->assertJsonPath('tracking.has_capi_token', true);

    // never in any JSON we return
    expect($this->actingAs($admin)->putJson(route('admin.landing.tracking.update', $page), ['tracking' => []])->getContent())->not->toContain($token);
    expect($this->actingAs($admin)->get(route('admin.landing.builder', $page))->getContent())->not->toContain($token);

    // encrypted at rest
    $raw = \Illuminate\Support\Facades\DB::table('landing_pages')->where('id', $page->id)->value('capi_access_token');
    expect($raw)->not->toContain($token)->and($page->refresh()->capi_access_token)->toBe($token);

    // not in snapshots or serialised models
    expect(json_encode($page->toArray()))->not->toContain($token);
    expect(json_encode(\App\Models\LandingPageVersion::all()->toArray()))->not->toContain($token);

    // not in public html
    app(\App\Services\Landing\LandingPageService::class)->publish($page->refresh(), $admin);
    auth()->logout();
    $html = $this->get('/secret-page')->assertOk()->getContent();
    expect($html)->not->toContain($token)->and($html)->not->toContain('access_token')->and($html)->toContain('999888777');
});

test('global capi settings are stored encrypted and never shown', function () {
    $admin = lpUser();

    $this->actingAs($admin)->put(route('admin.landing.tracking.global.update'), [
        'enabled' => true, 'pixel_id' => '555666777', 'capi_enabled' => true, 'api_version' => 'v21.0', 'access_token' => 'GLOBAL-TOKEN-XYZ',
    ])->assertRedirect();

    $raw = \Illuminate\Support\Facades\DB::table('landing_page_settings')->where('key', 'meta.access_token')->first();
    expect($raw->is_encrypted)->toBe(1)->and($raw->value)->not->toContain('GLOBAL-TOKEN-XYZ');
    expect(LandingPageSetting::get('meta.access_token'))->toBe('GLOBAL-TOKEN-XYZ');

    $page = $this->actingAs($admin)->get(route('admin.landing.tracking'))->assertOk()->getContent();
    expect($page)->not->toContain('GLOBAL-TOKEN-XYZ')->and($page)->toContain('has_access_token');
});

test('a landing owns its pixel by default; the global one applies only when chosen', function () {
    LandingPageSetting::put('meta.pixel_id', '424242424');
    $admin = lpUser();
    $svc = app(\App\Services\Landing\LandingPageService::class);
    $page = lpPage(['slug' => 'pixel-page'], $admin);

    // default: own settings, no pixel yet -> nothing is loaded (global is NOT silently used)
    $svc->publish($page, $admin);
    expect(lpRuntime($this->get('/pixel-page')->getContent())['pixel'])->toBeNull();

    // opt in to the global pixel
    $this->actingAs($admin)->putJson(route('admin.landing.tracking.update', $page), ['tracking' => ['meta' => ['use_global' => true]]]);
    $svc->publish($page->refresh(), $admin);
    expect(lpRuntime($this->get('/pixel-page')->getContent())['pixel']['id'])->toBe('424242424');

    // own pixel
    $this->actingAs($admin)->putJson(route('admin.landing.tracking.update', $page), ['tracking' => ['meta' => ['use_global' => false, 'pixel_id' => '777000777']]]);
    $svc->publish($page->refresh(), $admin);
    expect(lpRuntime($this->get('/pixel-page')->getContent())['pixel']['id'])->toBe('777000777');

    // disabled
    $this->actingAs($admin)->putJson(route('admin.landing.tracking.update', $page), ['tracking' => ['meta' => ['enabled' => false, 'pixel_id' => '777000777']]]);
    $svc->publish($page->refresh(), $admin);
    expect(lpRuntime($this->get('/pixel-page')->getContent())['pixel'])->toBeNull();
});

test('every landing sends to its own pixel with its own access token', function () {
    Http::fake(['graph.facebook.com/*' => Http::response(['events_received' => 1], 200)]);
    $admin = lpUser();
    $svc = app(\App\Services\Landing\LandingPageService::class);

    $setup = function (string $slug, string $pixel, string $token) use ($admin, $svc) {
        $page = lpPage(['slug' => $slug], $admin);
        $this->actingAs($admin)->putJson(route('admin.landing.tracking.update', $page), [
            'tracking' => ['meta' => ['pixel_id' => $pixel], 'capi' => ['enabled' => true]],
            'capi_access_token' => $token,
        ])->assertOk();
        $svc->publish($page->refresh(), $admin);
    };
    $setup('landing-a', '111111111', 'TOKEN-AAA-111');
    $setup('landing-b', '222222222', 'TOKEN-BBB-222');
    auth()->logout();

    $this->get('/landing-a')->assertOk();
    $this->get('/landing-b')->assertOk();

    Http::assertSent(fn ($r) => str_contains($r->url(), '/111111111/events') && $r['access_token'] === 'TOKEN-AAA-111');
    Http::assertSent(fn ($r) => str_contains($r->url(), '/222222222/events') && $r['access_token'] === 'TOKEN-BBB-222');
    Http::assertNotSent(fn ($r) => str_contains($r->url(), '/111111111/events') && $r['access_token'] === 'TOKEN-BBB-222');
    expect(lpRuntime($this->get('/landing-a')->getContent())['pixel']['id'])->toBe('111111111');
});

test('a landing without its own token never borrows another token', function () {
    Http::fake(['graph.facebook.com/*' => Http::response([], 200)]);
    LandingPageSetting::put('meta.access_token', 'GLOBAL-TOKEN', true);
    LandingPageSetting::put('meta.capi_enabled', '1');
    $admin = lpUser();
    $page = lpPage(['slug' => 'no-token'], $admin);
    $this->actingAs($admin)->putJson(route('admin.landing.tracking.update', $page), ['tracking' => ['meta' => ['pixel_id' => '333333333'], 'capi' => ['enabled' => true]]])->assertOk();
    app(\App\Services\Landing\LandingPageService::class)->publish($page->refresh(), $admin);
    auth()->logout();

    $this->get('/no-token')->assertOk();

    Http::assertNothingSent();
    $d = \App\Models\LandingPageEventDelivery::where('channel', 'capi')->first();
    expect($d->status)->toBe('failed')->and($d->error_message)->toContain('not fully configured');
});
