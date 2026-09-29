<?php

use App\Landing\Support\Sanitizer;
use App\Models\LandingPage;
use App\Models\LandingPageEvent;

test('existing application routes keep working alongside the landing fallback', function () {
    $this->get('/login')->assertOk();
    $this->get('/about')->assertOk();
    $this->get('/cart')->assertOk();
    // unknown URLs still 404 exactly as before
    $this->get('/this-does-not-exist')->assertNotFound();
    $this->get('/some/deep/path')->assertNotFound();
    // admin is still protected
    $this->get('/admin')->assertRedirect('/login');
});

test('a landing page can never shadow an existing route even if the row exists', function () {
    // Simulate a legacy/manual row that collides with /about
    LandingPage::create([
        'title' => 'Shadow', 'slug' => 'about', 'status' => 'published', 'published_at' => now(),
        'content_json' => ['version' => 1, 'sections' => []],
    ]);

    // /about is served by the real route, never the fallback
    $this->get('/about')->assertOk()->assertDontSee('Shadow');
});

test('seo tags are generated once with canonical, open graph and twitter cards', function () {
    $admin = lpUser();
    $page = lpPage(['slug' => 'seo-page', 'title' => 'SEO Page'], $admin);
    $this->actingAs($admin)->postJson(route('admin.landing.save', $page), ['seo' => [
        'title' => 'Custom SEO Title', 'description' => 'A description', 'robots' => 'noindex,nofollow',
        'og_title' => 'OG Title', 'og_image' => 'https://example.com/og.jpg', 'canonical' => 'https://example.com/canonical',
    ]])->assertOk();
    app(\App\Services\Landing\LandingPageService::class)->publish($page->refresh(), $admin);
    auth()->logout();

    $html = $this->get('/seo-page')->assertOk()->getContent();

    expect($html)
        ->toContain('<title>Custom SEO Title</title>')
        ->toContain('<link rel="canonical" href="https://example.com/canonical">')
        ->toContain('<meta name="description" content="A description">')
        ->toContain('<meta name="robots" content="noindex,nofollow">')
        ->toContain('<meta property="og:title" content="OG Title">')
        ->toContain('<meta property="og:image" content="https://example.com/og.jpg">')
        ->toContain('<meta name="twitter:card" content="summary_large_image">');

    expect(substr_count($html, 'name="description"'))->toBe(1)
        ->and(substr_count($html, 'rel="canonical"'))->toBe(1)
        ->and(substr_count($html, 'og:title'))->toBe(1);
});

test('renderer neutralises xss in every user controlled field', function () {
    $admin = lpUser();
    $evil = [
        lpNode('heading', ['text' => '<img src=x onerror=alert(1)>', 'link' => 'javascript:alert(1)']),
        lpNode('text', ['html' => '<p onclick="x()">hi</p><script>alert(2)</script><a href="javascript:alert(3)">l</a><iframe src="//evil"></iframe>']),
        lpNode('image', ['image' => 'javascript:alert(4)', 'alt' => '"><script>alert(5)</script>']),
        lpNode('button', ['text' => '</a><script>alert(6)</script>', 'url' => 'data:text/html,<script>alert(7)</script>']),
        lpNode('html', ['html' => '<div style="background:url(javascript:alert(8))" onmouseover="x()">x</div><style>body{display:none}</style><svg onload=alert(9)>']),
        lpNode('heading', ['text' => 'css'], ['custom_css' => 'selector{color:red}</style><script>alert(10)</script>', 'color' => 'red;}</style><script>alert(11)</script>', 'font_size' => '1px;}body{display:none']),
        lpNode('shortcode', ['code' => '<script>alert(12)</script> [utm_source]']),
        lpNode('video', ['url' => 'javascript:alert(13)', 'source' => 'file']),
    ];
    $page = lpPage(['slug' => 'evil', 'content' => lpContent('Safe', $evil)], $admin);
    app(\App\Services\Landing\LandingPageService::class)->saveDraft($page, ['settings' => [
        'custom_css' => 'body{}</style><script>alert(14)</script>', 'body_class' => 'a"><script>x</script>',
    ]], $admin, false);
    app(\App\Services\Landing\LandingPageService::class)->publish($page->refresh(), $admin);

    $html = $this->get('/evil?utm_source=%3Cscript%3Ealert(15)%3C/script%3E')->assertOk()->getContent();

    // Escaped text such as "&lt;img onerror=alert(1)&gt;" is harmless; live markup is not.
    expect($html)
        ->not->toMatch('/<script[^>]*>[^<]*alert\(/i')
        ->not->toMatch('/<[a-z][^>]*\son[a-z]+\s*=/i')
        ->not->toMatch('/(href|src)\s*=\s*["\']?\s*(javascript|data):/i')
        ->not->toContain('<iframe src="//evil"')
        ->not->toContain('<svg')
        ->not->toContain('alert(10)')->not->toContain('alert(11)')->not->toContain('alert(13)')->not->toContain('alert(14)')
        ->not->toContain('display:none}</style>')
        ->toContain('&lt;img src=x onerror=alert(1)&gt;');
    // the visible utm value is escaped too
    expect($html)->not->toContain('<script>alert(15)');
});

test('sanitizer unit checks', function () {
    expect(Sanitizer::url('javascript:alert(1)'))->toBe('')
        ->and(Sanitizer::url(" \tjava\nscript:alert(1)"))->toBe('')
        ->and(Sanitizer::url('data:text/html;base64,AAA'))->toBe('')
        ->and(Sanitizer::url('https://example.com/a?b=1'))->toBe('https://example.com/a?b=1')
        ->and(Sanitizer::url('/relative/path'))->toBe('/relative/path')
        ->and(Sanitizer::url('#form'))->toBe('#form')
        ->and(Sanitizer::url('mailto:hi@example.com'))->toBe('mailto:hi@example.com')
        ->and(Sanitizer::color('#fff'))->toBe('#fff')
        ->and(Sanitizer::color('red;}body{x:y'))->toBeNull()
        ->and(Sanitizer::length('12px'))->toBe('12px')
        ->and(Sanitizer::length('12px;color:red'))->toBeNull()
        ->and(Sanitizer::css('a{color:red}@import url(x);'))->toBe('')
        ->and(Sanitizer::css('selector{color:red}', '.x'))->toBe('.x{color:red}')
        ->and(Sanitizer::html('<b onclick=x>a</b><script>1</script>'))->toBe('<b>a</b>');
});

test('hind siliguri is a recognised web font for bangla pages', function () {
    expect(Sanitizer::fontFamily('Hind Siliguri'))->toContain('Hind Siliguri')
        ->and(Sanitizer::isWebFont('Hind Siliguri'))->toBeTrue()
        ->and(\App\Landing\Builder\LandingPageRenderer::fontsUrl(['Hind Siliguri']))
            ->toContain('family=Hind+Siliguri');
});

test('unknown elements render a safe fallback', function () {
    $admin = lpUser();
    $page = lpPage(['slug' => 'unknown-el'], $admin);
    // Stored directly to simulate legacy/imported content the registry no longer knows
    $content = lpContent('Known');
    $content['sections'][0]['children'][0]['children'][] = ['id' => 'mystery_abcdef01', 'type' => 'mystery_widget', 'content' => [], 'settings' => [], 'children' => []];
    $page->forceFill(['content_json' => $content])->save();

    $res = $this->actingAs($admin)->postJson(route('admin.landing.render', $page), ['content' => $content])->assertOk();
    expect($res->json('html'))->toContain('Unsupported element: mystery_widget');

    // publicly it is silently omitted
    app(\App\Services\Landing\LandingPageService::class)->publish($page->refresh(), $admin);
    auth()->logout();
    $this->get('/unknown-el')->assertOk()->assertSee('Known', false)->assertDontSee('mystery_widget', false);
});

test('responsive css is mobile first with tablet and desktop overrides', function () {
    $admin = lpUser();
    $heading = lpNode('heading', ['text' => 'Resp'], ['font_size' => ['desktop' => '56px', 'tablet' => '42px', 'mobile' => '30px']], [], 'heading_resp00001');
    lpPublished(['slug' => 'resp', 'content' => lpContent('x', [$heading])], $admin);

    $css = $this->get('/resp')->getContent();

    expect($css)->toContain('.lp-e-heading_resp00001{font-size:30px;}')
        ->toContain('@media(min-width:768px){.lp-e-heading_resp00001{font-size:42px;}}')
        ->toContain('@media(min-width:1025px){.lp-e-heading_resp00001{font-size:56px;}}');
});

test('responsive visibility generates per breakpoint hide rules', function () {
    $admin = lpUser();
    $btn = lpNode('button', ['text' => 'Hidden'], ['hide_mobile' => true, 'hide_desktop' => true], [], 'button_vis000001');
    lpPublished(['slug' => 'vis', 'content' => lpContent('x', [$btn])], $admin);

    $html = $this->get('/vis')->getContent();
    expect($html)->toContain('@media(max-width:767px){.lp-e-button_vis000001{display:none!important}}')
        ->toContain('@media(min-width:1025px){.lp-e-button_vis000001{display:none!important}}');
});

test('columns produce a responsive grid', function () {
    $admin = lpUser();
    $col = fn () => lpNode('column');
    $cols = lpNode('columns', ['layout' => '33-33-33', 'tablet_layout' => '2', 'mobile_layout' => '1'], [], [$col(), $col(), $col()], 'columns_grid00001');
    lpPublished(['slug' => 'grid', 'content' => lpContent('x', [$cols])], $admin);

    $html = $this->get('/grid')->getContent();
    expect($html)->toContain('.lp-e-columns_grid00001{grid-template-columns:repeat(1,minmax(0,1fr))}')
        ->toContain('@media(min-width:768px){.lp-e-columns_grid00001{grid-template-columns:repeat(2,minmax(0,1fr))}}')
        ->toContain('grid-template-columns:minmax(0,33fr) minmax(0,33fr) minmax(0,33fr)');
});

test('columns can keep several per line on mobile instead of always stacking', function () {
    $admin = lpUser();
    $col = fn () => lpNode('column');
    $cols = lpNode('columns', ['layout' => '25-25-25-25', 'tablet_layout' => 'same', 'mobile_layout' => '4'], [], [$col(), $col(), $col(), $col()], 'columns_oneline001');
    lpPublished(['slug' => 'oneline', 'content' => lpContent('x', [$cols])], $admin);

    $html = $this->get('/oneline')->getContent();
    // Base rule (mobile-first) already has 4 columns in one row - no stacking, no media query needed to un-stack it.
    expect($html)->toContain('.lp-e-columns_oneline001{grid-template-columns:repeat(4,minmax(0,1fr))}');
});

test('icon box icon size is responsive so a row of icon boxes can shrink on mobile', function () {
    $admin = lpUser();
    $box = lpNode('icon_box', ['icon' => 'star', 'title' => 'T'], ['icon_size' => ['desktop' => '32px', 'mobile' => '16px']], [], 'icon_box_shrink01');
    lpPublished(['slug' => 'iconshrink', 'content' => lpContent('x', [$box])], $admin);

    $html = $this->get('/iconshrink')->getContent();
    expect($html)->toContain('.lp-e-icon_box_shrink01 .lp-ib-icon{font-size:16px;}')
        ->toContain('@media(min-width:768px){.lp-e-icon_box_shrink01 .lp-ib-icon{font-size:32px;}}');
});

test('feature list icons are vertically centred against their text, not nudged by a fixed offset', function () {
    $admin = lpUser();
    $list = lpNode('feature_list', ['items' => [['icon' => 'check-circle', 'text' => 'A']]], [], [], 'feature_list01');
    lpPublished(['slug' => 'flist-align', 'content' => lpContent('x', [$list])], $admin);

    $html = $this->get('/flist-align')->getContent();
    expect($html)->toContain('.lp-e-feature_list01 li{display:flex;gap:10px;align-items:center}')
        ->not->toContain('margin-top:.2em');
});

test('icon box centres its own content so tiles of different text length stay aligned in a row', function () {
    $admin = lpUser();
    $box = lpNode('icon_box', ['icon' => 'star', 'title' => 'Short'], ['align' => 'center'], [], 'icon_box_align01');
    lpPublished(['slug' => 'iconalign', 'content' => lpContent('x', [$box])], $admin);

    $html = $this->get('/iconalign')->getContent();
    expect($html)->toContain('.lp-e-icon_box_align01{display:flex;flex-direction:column;justify-content:center;height:100%;box-sizing:border-box}')
        ->toContain('.lp-ib-title{margin:0 0 8px;font-size:1.25em;width:100%}')
        ->toContain('.lp-ib-desc{margin:0;width:100%}')
        ->toContain('.lp-e-icon_box_align01{align-items:center;}');
});

test('countdown units can be hidden individually and default to showing all four', function () {
    $admin = lpUser();
    $full = lpNode('countdown', ['target' => now()->addDay()->format('Y-m-d\TH:i')], [], [], 'countdown_full01');
    $noDays = lpNode('countdown', ['target' => now()->addHour()->format('Y-m-d\TH:i'), 'show_days' => false], [], [], 'countdown_nodays01');
    lpPublished(['slug' => 'cd-units', 'content' => lpContent('x', [$full, $noDays])], $admin);

    $html = $this->get('/cd-units')->getContent();
    $body = substr($html, strpos($html, 'id="lp-root"'));
    $first = substr($body, strpos($body, 'lp-e-countdown_full01'), strpos($body, 'lp-e-countdown_nodays01') - strpos($body, 'lp-e-countdown_full01'));
    expect($first)->toContain('data-cd="days"')->toContain('data-cd="hours"')->toContain('data-cd="minutes"')->toContain('data-cd="seconds"');

    // Isolate the second countdown's markup and confirm its "days" unit is gone.
    $second = substr($body, strpos($body, 'lp-e-countdown_nodays01'));
    $second = substr($second, 0, strpos($second, '</div></div>') + 12);
    expect($second)->not->toContain('data-cd="days"')->toContain('data-cd="hours"');
});

test('the image slider renders slides, links and a responsive height, reusing the generic slider runtime', function () {
    $admin = lpUser();
    $slider = lpNode('image_slider', [
        'images' => [
            ['image' => 'https://example.com/a.jpg', 'alt' => 'Banner A', 'link' => 'https://example.com/a'],
            ['image' => 'https://example.com/b.jpg', 'alt' => 'Banner B', 'link' => ''],
        ],
        'slides_desktop' => '1',
    ], ['height' => ['desktop' => '420px', 'mobile' => '220px']], [], 'image_slider01');
    lpPublished(['slug' => 'islider', 'content' => lpContent('x', [$slider])], $admin);

    $html = $this->get('/islider')->getContent();
    expect($html)->toContain('data-lp-slider')
        ->toContain('lp-ts-no-js') // same CSS scroll-snap no-JS fallback the testimonial slider uses
        ->toContain('src="https://example.com/a.jpg"')->toContain('src="https://example.com/b.jpg"')
        ->toContain('<a href="https://example.com/a">')
        ->toContain('data-ts-prev')->toContain('data-ts-dot="0"')
        ->toContain('.lp-e-image_slider01 .lp-is-viewport, .lp-e-image_slider01 .lp-is-slide{height:220px;}')
        ->toContain('@media(min-width:768px){.lp-e-image_slider01 .lp-is-viewport, .lp-e-image_slider01 .lp-is-slide{height:420px;}}');
});

test('an image slider with no images renders nothing on the public page', function () {
    $slider = lpNode('image_slider', ['images' => []]);
    lpPublished(['slug' => 'islider-empty', 'content' => lpContent('x', [$slider])]);

    $this->get('/islider-empty')->assertOk()->assertDontSee('data-ts-track', false);
});

test('the testimonial slider renders slides, arrows and dots, and stays swipeable without js', function () {
    $admin = lpUser();
    $slider = lpNode('testimonial_slider', [
        'items' => [
            ['quote' => 'Great product!', 'name' => 'Amina', 'role' => 'Dhaka', 'rating' => 5],
            ['quote' => 'Fast delivery.', 'name' => 'Rahim', 'role' => 'Khulna', 'rating' => 4],
            ['quote' => 'Would buy again.', 'name' => 'Sara', 'role' => 'Sylhet', 'rating' => 5],
        ],
        'slides_desktop' => '3',
    ], [], [], 'testimonial_slider01');
    lpPublished(['slug' => 'tslider', 'content' => lpContent('x', [$slider])], $admin);

    $html = $this->get('/tslider')->getContent();
    expect($html)->toContain('data-lp-slider')
        ->toContain('lp-ts-no-js') // CSS scroll-snap fallback class present until JS removes it
        ->toContain('Great product!')->toContain('Fast delivery.')->toContain('Would buy again.')
        ->toContain('data-ts-prev')->toContain('data-ts-next')
        ->toContain('data-ts-dot="0"')->toContain('data-ts-dot="1"')->toContain('data-ts-dot="2"')
        ->toContain('@media(min-width:1025px){.lp-e-testimonial_slider01 .lp-ts-slide{flex:0 0 33.3333%}}');
});

test('a single testimonial hides the slider controls entirely', function () {
    $admin = lpUser();
    $slider = lpNode('testimonial_slider', ['items' => [['quote' => 'Solo review.', 'name' => 'Only One', 'rating' => 5]]]);
    lpPublished(['slug' => 'tslider-solo', 'content' => lpContent('x', [$slider])], $admin);

    $html = $this->get('/tslider-solo')->getContent();
    expect($html)->toContain('Solo review.')->not->toContain('data-ts-prev')->not->toContain('data-ts-dot');
});

test('an empty testimonial slider renders nothing on the public page', function () {
    $slider = lpNode('testimonial_slider', ['items' => []]);
    lpPublished(['slug' => 'tslider-empty', 'content' => lpContent('x', [$slider])]);

    $this->get('/tslider-empty')->assertOk()->assertDontSee('data-ts-track', false);
});

test('page view is logged internally without blocking the response', function () {
    lpPublished(['slug' => 'counted']);

    $this->get('/counted?utm_source=facebook')->assertOk();

    $event = LandingPageEvent::firstOrFail();
    expect($event->event_name)->toBe('PageView')
        ->and($event->source)->toBe('pageload')
        ->and($event->utm_source)->toBe('facebook')
        ->and($event->event_id)->toMatch('/^[0-9a-f-]{36}$/');
});

test('bots do not inflate page views', function () {
    lpPublished(['slug' => 'no-bots']);

    $this->get('/no-bots', ['User-Agent' => 'Googlebot/2.1'])->assertOk();

    expect(LandingPageEvent::count())->toBe(0);
});

test('unknown urls still 404 (not 500) when the module tables are not migrated yet', function () {
    \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
    foreach (['landing_page_event_deliveries', 'landing_page_events', 'landing_page_leads', 'landing_page_versions', 'landing_pages'] as $table) {
        \Illuminate\Support\Facades\Schema::dropIfExists($table);
    }

    $this->get('/winterclothes')->assertNotFound();
    $this->get('/about')->assertOk();
});
