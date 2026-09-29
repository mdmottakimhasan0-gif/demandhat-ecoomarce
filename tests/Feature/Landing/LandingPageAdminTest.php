<?php

use App\Models\LandingPage;
use App\Models\LandingPageVersion;
use Illuminate\Support\Facades\Cache;

// ---------------------------------------------------------------- create ----

test('admin can create a landing page and lands in the builder', function () {
    $admin = lpUser();

    $response = $this->actingAs($admin)->post('/admin/landing-pages', ['title' => 'USA Offer', 'slug' => 'usa-offer']);

    $page = LandingPage::where('slug', 'usa-offer')->firstOrFail();
    $response->assertRedirect(route('admin.landing.builder', $page));
    expect($page->status)->toBe('draft')
        ->and($page->created_by)->toBe($admin->id)
        ->and($page->content_json['version'])->toBe(1)
        ->and($page->versions()->count())->toBe(1);
});

test('slug is generated from the title when omitted', function () {
    $this->actingAs(lpUser())->post('/admin/landing-pages', ['title' => 'Black Friday Sale!']);

    expect(LandingPage::where('slug', 'black-friday-sale')->exists())->toBeTrue();
});

test('slugs must be unique', function () {
    lpPage(['slug' => 'campaign']);

    $this->actingAs(lpUser())->post('/admin/landing-pages', ['title' => 'Another', 'slug' => 'campaign'])
        ->assertSessionHasErrors('slug');

    expect(LandingPage::count())->toBe(1);
});

test('slugs that collide with existing routes or public files are rejected', function (string $slug) {
    $this->actingAs(lpUser())->post('/admin/landing-pages', ['title' => 'X', 'slug' => $slug])
        ->assertSessionHasErrors('slug');
})->with(['about', 'admin', 'login', 'cart', 'checkout', 'api', 'storage', 'build', 'up']);

// ---------------------------------------------------------------- update ----

test('save updates the draft and creates a version; autosave does not', function () {
    $admin = lpUser();
    $page = lpPage(user: $admin);
    $versions = $page->versions()->count();

    $this->actingAs($admin)->postJson(route('admin.landing.autosave', $page), ['content' => lpContent('Autosaved')])
        ->assertOk()->assertJsonPath('ok', true);
    expect($page->versions()->count())->toBe($versions);

    $this->actingAs($admin)->postJson(route('admin.landing.save', $page), ['title' => 'Renamed', 'content' => lpContent('Saved heading')])
        ->assertOk();

    $page->refresh();
    expect($page->title)->toBe('Renamed')
        ->and($page->versions()->count())->toBe($versions + 1)
        ->and(json_encode($page->content_json))->toContain('Saved heading');
});

test('invalid builder structure is rejected with a 422', function () {
    $admin = lpUser();
    $page = lpPage(user: $admin);

    // a heading directly at page root is not allowed
    $this->actingAs($admin)->postJson(route('admin.landing.save', $page), [
        'content' => ['version' => 1, 'sections' => [lpNode('heading', ['text' => 'x'])]],
    ])->assertStatus(422);
});

test('element ids are always unique and stable', function () {
    $admin = lpUser();
    $page = lpPage(user: $admin);

    $dup = lpNode('heading', ['text' => 'a'], [], [], 'heading_duplicate1');
    $dup2 = lpNode('heading', ['text' => 'b'], [], [], 'heading_duplicate1');
    $content = ['version' => 1, 'sections' => [lpNode('section', [], [], [lpNode('container', [], [], [$dup, $dup2])])]];

    $this->actingAs($admin)->postJson(route('admin.landing.save', $page), ['content' => $content])->assertOk();

    $ids = [];
    \App\Landing\Builder\ContentTree::walk($page->refresh()->content_json, function ($n) use (&$ids) {
        $ids[] = $n['id'];
    });
    expect($ids)->toHaveCount(count(array_unique($ids)))->and($ids)->toContain('heading_duplicate1');
});

// ------------------------------------------------------- draft / publish ----

test('a draft page is not visible publicly', function () {
    lpPage(['slug' => 'secret-draft']);

    $this->get('/secret-draft')->assertNotFound();
});

test('a published page renders at /{slug}', function () {
    lpPublished(['slug' => 'usa-offer', 'title' => 'USA Offer']);

    $this->get('/usa-offer')->assertOk()->assertSee('Grow Your Business', false)->assertSee('<title>USA Offer</title>', false);
});

test('editing a published page does not change what visitors see until republish', function () {
    $admin = lpUser();
    $page = lpPublished(['slug' => 'live-page'], $admin);

    $this->actingAs($admin)->postJson(route('admin.landing.save', $page), ['content' => lpContent('DRAFT ONLY HEADING')])->assertOk();

    $this->get('/live-page')->assertSee('Grow Your Business', false)->assertDontSee('DRAFT ONLY HEADING', false);

    $this->actingAs($admin)->postJson(route('admin.landing.publish', $page))->assertOk();

    $this->get('/live-page')->assertSee('DRAFT ONLY HEADING', false);
});

test('unpublishing takes the page offline immediately even when cached', function () {
    $admin = lpUser();
    $page = lpPublished(['slug' => 'cached-page'], $admin);

    $this->get('/cached-page')->assertOk(); // warms the cache
    $this->actingAs($admin)->postJson(route('admin.landing.unpublish', $page))->assertOk();

    $this->get('/cached-page')->assertNotFound();
});

test('publishing fails without content and keeps the published version intact', function () {
    $admin = lpUser();
    $page = lpPublished(['slug' => 'keep-me'], $admin);
    $publishedVersion = $page->published_version_id;

    $page->forceFill(['content_json' => ['version' => 1, 'sections' => []]])->save();

    $this->actingAs($admin)->postJson(route('admin.landing.publish', $page))->assertStatus(422)->assertJsonValidationErrors('publish');

    expect($page->refresh()->published_version_id)->toBe($publishedVersion)->and($page->status)->toBe('published');
    $this->get('/keep-me')->assertOk();
});

test('the published version cannot be deleted', function () {
    $admin = lpUser();
    $page = lpPublished([], $admin);

    $this->actingAs($admin)->deleteJson(route('admin.landing.versions.destroy', [$page, $page->published_version_id]))
        ->assertStatus(422);

    expect(LandingPageVersion::find($page->published_version_id))->not->toBeNull();
});

test('drafts are never cached', function () {
    $admin = lpUser();
    lpPage(['slug' => 'draft-cache'], $admin);

    $this->get('/draft-cache')->assertNotFound();
    expect(Cache::get('landing:page:1:draft-cache'))->toBeNull();
});

// -------------------------------------------------------------- versions ----

test('restoring a version restores the draft but not the published page', function () {
    $admin = lpUser();
    $page = lpPublished(['slug' => 'restore-me'], $admin);
    $original = $page->versions()->orderBy('version_number')->first();

    $this->actingAs($admin)->postJson(route('admin.landing.save', $page), ['content' => lpContent('Second version')])->assertOk();

    $this->actingAs($admin)->postJson(route('admin.landing.versions.restore', [$page, $original]))->assertOk();

    $page->refresh();
    expect(json_encode($page->content_json))->toContain('Grow Your Business')->not->toContain('Second version');
    // Still serving the published snapshot
    $this->get('/restore-me')->assertSee('Grow Your Business', false);
    expect($page->versions()->count())->toBeGreaterThan(3);
});

test('version list marks published and latest', function () {
    $admin = lpUser();
    $page = lpPublished([], $admin);

    $versions = $this->actingAs($admin)->getJson(route('admin.landing.versions', $page))->assertOk()->json('versions');

    expect(collect($versions)->where('is_published', true))->toHaveCount(1)
        ->and(collect($versions)->where('is_latest', true))->toHaveCount(1);
});

// ------------------------------------------------------------- duplicate ----

test('duplicating copies design but not leads, events or the access token', function () {
    $admin = lpUser();
    $page = lpPublished(['slug' => 'original'], $admin);
    $page->capi_access_token = 'EAAB-secret-token';
    $page->save();
    $page->leads()->create(['name' => 'A', 'email' => 'a@example.com', 'status' => 'new', 'created_at' => now()]);

    $this->actingAs($admin)->post(route('admin.landing.duplicate', $page))->assertRedirect();

    $copy = LandingPage::where('slug', 'original-copy')->firstOrFail();
    expect($copy->title)->toBe('Test Landing Copy')
        ->and($copy->status)->toBe('draft')
        ->and($copy->leads()->count())->toBe(0)
        ->and($copy->hasCapiToken())->toBeFalse()
        ->and(json_encode($copy->content_json))->toContain('Grow Your Business');

    $originalIds = [];
    \App\Landing\Builder\ContentTree::walk($page->content_json, function ($n) use (&$originalIds) {
        $originalIds[] = $n['id'];
    });
    \App\Landing\Builder\ContentTree::walk($copy->content_json, function ($n) use ($originalIds) {
        expect($originalIds)->not->toContain($n['id']);
    });

    // a second duplicate gets a distinct slug
    $this->actingAs($admin)->post(route('admin.landing.duplicate', $page));
    expect(LandingPage::where('slug', 'original-copy-2')->exists())->toBeTrue();
});

// ----------------------------------------------------------- permissions ----

test('guests are sent to login and customers to their dashboard', function () {
    $this->get('/admin/landing-pages')->assertRedirect('/login');
    $this->actingAs(lpUser('customer'))->get('/admin/landing-pages')->assertRedirect('/dashboard');
});

test('employees are forbidden from the landing page area', function () {
    $this->actingAs(lpUser('employee'))->get('/admin/landing-pages')->assertForbidden();
});

test('managers can edit and publish but cannot delete or manage tracking', function () {
    $manager = lpUser('manager');
    $page = lpPage(user: $manager);

    $this->actingAs($manager)->get('/admin/landing-pages')->assertOk();
    $this->actingAs($manager)->postJson(route('admin.landing.publish', $page))->assertOk();

    $this->actingAs($manager)->delete(route('admin.landing.destroy', $page))->assertForbidden();
    $this->actingAs($manager)->putJson(route('admin.landing.tracking.update', $page), ['tracking' => ['meta' => ['pixel_id' => '123456789']]])->assertForbidden();
    $this->actingAs($manager)->get(route('admin.landing.tracking'))->assertForbidden();
});

test('admins can delete a page and its slug becomes reusable', function () {
    $admin = lpUser();
    $page = lpPublished(['slug' => 'delete-me'], $admin);

    $this->actingAs($admin)->delete(route('admin.landing.destroy', $page))->assertRedirect(route('admin.landing.index'));

    $this->get('/delete-me')->assertNotFound();
    $this->actingAs($admin)->post('/admin/landing-pages', ['title' => 'New', 'slug' => 'delete-me'])->assertSessionHasNoErrors();
});

test('people without custom-code permission cannot change custom code', function () {
    $admin = lpUser();
    $manager = lpUser('manager');
    $page = lpPage(user: $admin);

    $withCode = lpContent('Code page', [lpNode('custom_code', ['code' => '<script>window.evil=1</script>'], [], [], 'custom_code_aa001')]);
    $this->actingAs($manager)->postJson(route('admin.landing.save', $page), ['content' => $withCode])->assertOk();
    expect(json_encode($page->refresh()->content_json))->not->toContain('window.evil');

    $this->actingAs($admin)->postJson(route('admin.landing.save', $page), ['content' => $withCode])->assertOk();
    expect(json_encode($page->refresh()->content_json))->toContain('window.evil');

    // A manager re-saving must not be able to strip or alter the admin's code
    $this->actingAs($manager)->postJson(route('admin.landing.save', $page), ['content' => lpContent('Code page', [lpNode('custom_code', ['code' => 'tampered'], [], [], 'custom_code_aa001')])])->assertOk();
    expect(json_encode($page->refresh()->content_json))->toContain('window.evil')->not->toContain('tampered');
});

// --------------------------------------------------------------- preview ----

test('preview links are signed, expiring and never indexable', function () {
    $admin = lpUser();
    $page = lpPage(['slug' => 'preview-me', 'title' => 'Preview Me'], $admin);

    $this->get(route('landing.preview', $page))->assertForbidden(); // unsigned

    $url = $this->actingAs($admin)->postJson(route('admin.landing.preview-link', $page))->assertOk()->json('url');
    auth()->logout();

    $this->get($url)->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertSee('noindex,nofollow', false)
        ->assertSee('Grow Your Business', false);
});

test('the builder canvas and render endpoint are protected and sanitised', function () {
    $admin = lpUser();
    $page = lpPage(user: $admin);

    $this->get(route('admin.landing.canvas', $page))->assertRedirect('/login');

    $bad = lpContent('x', [lpNode('text', ['html' => '<p>ok</p><script>alert(1)</script><img src=x onerror=alert(2)>'])]);
    $res = $this->actingAs($admin)->postJson(route('admin.landing.render', $page), ['content' => $bad])->assertOk();

    expect($res->json('html'))->toContain('<p>ok</p>')->not->toContain('<script')->not->toContain('onerror');
});

test('dragging a single spacing handle in the canvas persists as a per-side box merge, like the style panel does', function () {
    $admin = lpUser();
    $page = lpPage(user: $admin);

    // The one-sided update a mouse-dragged padding handle sends: only "bottom" changes, the
    // other three sides (already set for this device) are carried over unchanged - exactly
    // what Canvas.jsx's resize-handler does before calling the normal setSetting() path.
    $container = lpNode('container', [], ['padding' => ['desktop' => ['top' => '10px', 'right' => '20px', 'bottom' => '40px', 'left' => '20px']]], [], 'container_spacing01');
    $content = lpContent('x', [$container]);

    $this->actingAs($admin)->postJson(route('admin.landing.save', $page), ['content' => $content])->assertOk();

    $page->refresh();
    expect(json_encode($page->content_json))->toContain('"top":"10px"')->toContain('"bottom":"40px"');

    $res = $this->actingAs($admin)->postJson(route('admin.landing.render', $page), ['content' => $page->content_json])->assertOk();
    expect($res->json('css'))->toContain('padding-top:10px')->toContain('padding-bottom:40px')->toContain('padding-right:20px')->toContain('padding-left:20px');
});

test('custom page javascript is admin-only and cannot be altered by managers', function () {
    $admin = lpUser();
    $manager = lpUser('manager');
    $page = lpPage(user: $admin);

    $this->actingAs($manager)->postJson(route('admin.landing.save', $page), ['settings' => ['custom_js' => 'window.evil=1']])->assertOk();
    expect($page->refresh()->settings_json['custom_js'])->toBe('');

    $this->actingAs($admin)->postJson(route('admin.landing.save', $page), ['settings' => ['custom_js' => 'window.trusted=1']])->assertOk();
    $this->actingAs($manager)->postJson(route('admin.landing.save', $page), ['settings' => ['custom_js' => 'window.evil=1', 'body_class' => 'x']])->assertOk();

    expect($page->refresh()->settings_json['custom_js'])->toBe('window.trusted=1')->and($page->settings_json['body_class'])->toBe('x');

    // managers never receive script contents through the tracking payload either
    $props = $this->actingAs($manager)->get(route('admin.landing.builder', $page))->viewData('page')['props'];
    expect($props['tracking']['scripts'])->toBe(['head' => '', 'body_start' => '', 'body_end' => '']);
});
