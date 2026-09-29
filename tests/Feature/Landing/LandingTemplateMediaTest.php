<?php

use App\Models\LandingPage;
use App\Models\LandingPageTemplate;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// -------------------------------------------------------------- templates ----

test('a page can be saved as a template', function () {
    $admin = lpUser();
    $page = lpPage(['slug' => 'source'], $admin);

    $this->actingAs($admin)->postJson(route('admin.landing.templates.store'), [
        'landing_page_id' => $page->id, 'name' => 'My Template', 'category' => 'Lead Generation', 'description' => 'Reusable',
    ])->assertOk();

    $tpl = LandingPageTemplate::firstOrFail();
    expect($tpl->name)->toBe('My Template')->and($tpl->category)->toBe('Lead Generation')
        ->and(json_encode($tpl->content_json))->toContain('Grow Your Business');
});

test('templates strip raw custom code', function () {
    $admin = lpUser();
    $page = lpPage(['slug' => 'source', 'content' => lpContent('x', [lpNode('custom_code', ['code' => '<script>evil()</script>'])])], $admin);
    expect(json_encode($page->content_json))->toContain('evil()');

    $this->actingAs($admin)->postJson(route('admin.landing.templates.store'), ['landing_page_id' => $page->id, 'name' => 'T', 'category' => 'Custom'])->assertOk();

    expect(json_encode(LandingPageTemplate::first()->content_json))->not->toContain('evil()');
});

test('creating a page from a template copies the design with fresh element ids', function () {
    $admin = lpUser();
    $source = lpPage(['slug' => 'source'], $admin);
    $tpl = LandingPageTemplate::create([
        'name' => 'T', 'category' => 'Custom', 'is_public' => true, 'created_by' => $admin->id,
        'content_json' => $source->content_json, 'settings_json' => $source->settings_json, 'seo_json' => $source->seo_json,
    ]);

    $this->actingAs($admin)->post(route('admin.landing.templates.use', $tpl), ['title' => 'From Template', 'slug' => 'from-template'])->assertRedirect();

    $page = LandingPage::where('slug', 'from-template')->firstOrFail();
    expect(json_encode($page->content_json))->toContain('Grow Your Business')->and($page->status)->toBe('draft');
    $old = [];
    \App\Landing\Builder\ContentTree::walk($tpl->content_json, function ($n) use (&$old) {
        $old[] = $n['id'];
    });
    \App\Landing\Builder\ContentTree::walk($page->content_json, function ($n) use ($old) {
        expect($old)->not->toContain($n['id']);
    });
});

test('creating a page via the create form with a template id works', function () {
    $admin = lpUser();
    $tpl = LandingPageTemplate::create(['name' => 'T', 'category' => 'Custom', 'content_json' => lpContent('Templated'), 'is_public' => true]);

    $this->actingAs($admin)->post('/admin/landing-pages', ['title' => 'Via form', 'slug' => 'via-form', 'template_id' => $tpl->id])->assertRedirect();

    expect(json_encode(LandingPage::where('slug', 'via-form')->first()->content_json))->toContain('Templated');
});

test('templates can be duplicated and deleted, and the seeder ships real templates', function () {
    $admin = lpUser();
    $this->seed(\Database\Seeders\LandingPageTemplatesSeeder::class);

    $names = LandingPageTemplate::pluck('name')->all();
    expect($names)->toContain('Lead Generation', 'Product Offer', 'Consultation', 'Agency Service', 'Coming Soon', 'Electronics Product', 'Book Launch', 'E-commerce Sale', 'Wooden Craft Product (Bangla)', 'Product Checkout (Bangla)');

    $tpl = LandingPageTemplate::first();
    $this->actingAs($admin)->post(route('admin.landing.templates.duplicate', $tpl))->assertRedirect();
    expect(LandingPageTemplate::count())->toBe(count($names) + 1);

    $this->actingAs($admin)->delete(route('admin.landing.templates.destroy', $tpl))->assertRedirect();
    expect(LandingPageTemplate::count())->toBe(count($names));

    // every seeded template must be a valid, renderable builder document
    foreach (LandingPageTemplate::all() as $t) {
        app(\App\Landing\Builder\ContentNormalizer::class)->normalize($t->content_json);
        $url = \Illuminate\Support\Facades\URL::signedRoute('landing.template-preview', ['template' => $t->id]);
        $this->get($url)->assertOk();
    }
});

test('a template can be exported and imported into a fresh library, e.g. onto another server', function () {
    $admin = lpUser();
    $tpl = LandingPageTemplate::create([
        'name' => 'My Wooden Craft Page', 'category' => 'Product', 'description' => 'Local build',
        'is_public' => true, 'created_by' => $admin->id,
        'content_json' => lpContent('হ্যালো Bangla', [lpNode('custom_code', ['code' => '<script>x()</script>'])]),
        'settings_json' => ['font_family' => 'Hind Siliguri'],
    ]);

    $json = $this->actingAs($admin)->get(route('admin.landing.templates.export', $tpl))->assertOk()->json();
    expect($json['format'])->toBe('landing-template')
        ->and($json['name'])->toBe('My Wooden Craft Page')
        ->and($json['settings']['font_family'])->toBe('Hind Siliguri');

    // fresh library: as if this json file were carried to another server and imported there
    LandingPageTemplate::query()->delete();
    $file = UploadedFile::fake()->createWithContent('template.json', json_encode($json));
    $this->actingAs($admin)->post(route('admin.landing.templates.import'), ['file' => $file])->assertRedirect();

    $imported = LandingPageTemplate::firstOrFail();
    expect($imported->name)->toBe('My Wooden Craft Page')
        ->and($imported->category)->toBe('Product')
        ->and($imported->settings_json['font_family'])->toBe('Hind Siliguri')
        ->and(json_encode($imported->content_json, JSON_UNESCAPED_UNICODE))->toContain('হ্যালো Bangla')->not->toContain('x()');
});

test('importing a template twice keeps the library tidy by numbering the duplicate name', function () {
    $admin = lpUser();
    $json = ['format' => 'landing-template', 'name' => 'Twice', 'category' => 'Custom', 'content' => lpContent('Twice')];
    $post = fn () => $this->actingAs($admin)->post(route('admin.landing.templates.import'), [
        'file' => UploadedFile::fake()->createWithContent('t.json', json_encode($json)),
    ])->assertRedirect();

    $post();
    $post();

    expect(LandingPageTemplate::pluck('name')->all())->toContain('Twice', 'Twice (2)');
});

test('template import rejects a garbage or foreign file', function () {
    $admin = lpUser();

    $this->actingAs($admin)->post(route('admin.landing.templates.import'), [
        'file' => UploadedFile::fake()->createWithContent('bad.json', json_encode(['format' => 'nope'])),
    ])->assertSessionHasErrors('file');

    // a plain page export must not be accepted as a template export
    $this->actingAs($admin)->post(route('admin.landing.templates.import'), [
        'file' => UploadedFile::fake()->createWithContent('page.json', json_encode(['format' => 'landing-page', 'content' => lpContent()])),
    ])->assertSessionHasErrors('file');

    expect(LandingPageTemplate::count())->toBe(0);
});

test('template export and import are limited to users with the templates permission', function () {
    $employee = lpUser('employee');
    $tpl = LandingPageTemplate::create(['name' => 'Guarded', 'category' => 'Custom', 'content_json' => lpContent()]);

    $this->actingAs($employee)->get(route('admin.landing.templates.export', $tpl))->assertForbidden();
    $this->actingAs($employee)->post(route('admin.landing.templates.import'), [
        'file' => UploadedFile::fake()->createWithContent('t.json', json_encode(['format' => 'landing-template', 'name' => 'X', 'content' => lpContent()])),
    ])->assertForbidden();
});

// -------------------------------------------------------- design editor ----

test('a template can be opened and edited in the visual builder', function () {
    $admin = lpUser();
    $tpl = LandingPageTemplate::create(['name' => 'Editable', 'category' => 'Custom', 'content_json' => lpContent('Original')]);

    $this->actingAs($admin)->get(route('admin.landing.templates.edit', $tpl))->assertOk()
        ->assertInertia(fn ($p) => $p->component('Admin/LandingPages/Builder')
            ->where('page.id', $tpl->id)
            ->where('page.title', 'Editable')
            ->where('page.slug', null)
            ->where('urls.canvas', route('admin.landing.templates.canvas', $tpl))
            ->missing('urls.publish')
            ->where('can', fn ($can) => ! collect($can)->contains('landing_pages.publish') && ! collect($can)->contains('landing_pages.tracking')));

    // canvas renders the stored draft
    $this->actingAs($admin)->get(route('admin.landing.templates.canvas', $tpl))->assertOk()->assertSee('Original');

    // render previews unsaved edits without storing them
    $before = $tpl->content_json;
    $edited = lpContent('Edited Heading');
    $this->actingAs($admin)->postJson(route('admin.landing.templates.render', $tpl), ['content' => $edited])
        ->assertOk()->assertSee('Edited Heading', false);
    expect($tpl->fresh()->content_json)->toBe($before); // untouched

    // save persists it onto the template itself (not a new page/template)
    $this->actingAs($admin)->postJson(route('admin.landing.templates.save', $tpl), ['content' => $edited, 'title' => 'Renamed'])
        ->assertOk()->assertJsonPath('ok', true);

    $tpl->refresh();
    expect($tpl->name)->toBe('Renamed')->and(json_encode($tpl->content_json))->toContain('Edited Heading');
    expect(LandingPageTemplate::count())->toBe(1); // still the same one row

    // scripts are stripped even for an admin editing a template
    $withScript = lpContent('Safe', [lpNode('custom_code', ['code' => '<script>bad()</script>'])]);
    $this->actingAs($admin)->postJson(route('admin.landing.templates.autosave', $tpl), ['content' => $withScript])->assertOk();
    expect(json_encode($tpl->fresh()->content_json))->not->toContain('bad()');

    // preview link works off the saved draft
    $url = $this->actingAs($admin)->postJson(route('admin.landing.templates.preview-link', $tpl))->assertOk()->json('url');
    $this->get($url)->assertOk();
});

test('the template editor is limited to users with the templates permission', function () {
    $employee = lpUser('employee');
    $tpl = LandingPageTemplate::create(['name' => 'Guarded', 'category' => 'Custom', 'content_json' => lpContent()]);

    $this->actingAs($employee)->get(route('admin.landing.templates.edit', $tpl))->assertForbidden();
    $this->actingAs($employee)->get(route('admin.landing.templates.canvas', $tpl))->assertForbidden();
    $this->actingAs($employee)->postJson(route('admin.landing.templates.save', $tpl), ['content' => lpContent()])->assertForbidden();
});

test('template preview requires a signed url', function () {
    $tpl = LandingPageTemplate::create(['name' => 'T', 'category' => 'Custom', 'content_json' => lpContent()]);

    $this->get(route('landing.template-preview', $tpl))->assertForbidden();
});

test('templates are limited to roles with the templates permission', function () {
    $this->actingAs(lpUser('manager'))->get(route('admin.landing.templates.index'))->assertOk();
    config(['landing.permissions.manager' => ['landing_pages.view']]);
    $this->actingAs(lpUser('manager'))->get(route('admin.landing.templates.index'))->assertForbidden();
});

// ------------------------------------------------------------ import/export ----

test('export then import round trips and strips scripts', function () {
    $admin = lpUser();
    $page = lpPage(['slug' => 'exp', 'content' => lpContent('Exported', [lpNode('custom_code', ['code' => '<script>x()</script>'])])], $admin);

    $json = $this->actingAs($admin)->get(route('admin.landing.export', $page))->assertOk()->json();
    expect($json['format'])->toBe('landing-page')->and(json_encode($json))->not->toContain('capi_access_token');

    $file = UploadedFile::fake()->createWithContent('page.json', json_encode($json));
    $this->actingAs($admin)->post(route('admin.landing.import'), ['file' => $file])->assertRedirect();

    $imported = LandingPage::where('slug', 'exp-2')->orWhere('slug', '!=', 'exp')->latest('id')->first();
    expect(json_encode($imported->content_json))->toContain('Exported')->not->toContain('x()')->and($imported->status)->toBe('draft');
});

test('import rejects garbage', function () {
    $admin = lpUser();
    $file = UploadedFile::fake()->createWithContent('bad.json', json_encode(['format' => 'nope']));

    $this->actingAs($admin)->post(route('admin.landing.import'), ['file' => $file])->assertSessionHasErrors('file');
});

// ------------------------------------------------------------------ media ----

test('valid images are stored under a random name', function () {
    Storage::fake('public');
    $admin = lpUser();

    $res = $this->actingAs($admin)->postJson(route('admin.landing.media.store'), ['file' => UploadedFile::fake()->image('Team Photo.png', 300, 200), 'alt' => 'Team'])
        ->assertCreated();

    $path = $res->json('media.path');
    expect($path)->toStartWith('landing/')->toEndWith('.png')->not->toContain('Team');
    Storage::disk('public')->assertExists($path);
    expect($res->json('media.width'))->toBe(300)->and($res->json('media.alt'))->toBe('Team');
});

test('unsafe uploads are rejected', function (string $name, string $content) {
    Storage::fake('public');

    $file = UploadedFile::fake()->createWithContent($name, $content);
    $this->actingAs(lpUser())->postJson(route('admin.landing.media.store'), ['file' => $file])->assertStatus(422)->assertJsonValidationErrors('file');

    expect(Storage::disk('public')->allFiles())->toBe([]);
})->with([
    'php file' => ['shell.php', '<?php system($_GET["c"]); ?>'],
    'php disguised as jpg' => ['photo.jpg', '<?php system($_GET["c"]); ?>'],
    'svg with script' => ['logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'],
    'html as png' => ['a.png', '<html><script>alert(1)</script></html>'],
    'polyglot gif' => ['a.gif', "GIF89a<?php echo 1; ?>"],
]);

test('oversized images are rejected', function () {
    Storage::fake('public');
    config(['landing.media.max_kb' => 50]);

    $this->actingAs(lpUser())->postJson(route('admin.landing.media.store'), ['file' => UploadedFile::fake()->image('big.jpg')->size(200)])
        ->assertStatus(422);
});

test('media can be listed and deleted only by permitted users', function () {
    Storage::fake('public');
    $admin = lpUser();
    $id = $this->actingAs($admin)->postJson(route('admin.landing.media.store'), ['file' => UploadedFile::fake()->image('a.jpg')])->json('media.id');

    $this->actingAs($admin)->getJson(route('admin.landing.media.list'))->assertOk()->assertJsonPath('data.0.id', $id);

    $this->actingAs(lpUser('manager'))->deleteJson(route('admin.landing.media.destroy', $id))->assertForbidden();
    $this->actingAs($admin)->deleteJson(route('admin.landing.media.destroy', $id))->assertOk();
    expect(Storage::disk('public')->allFiles())->toBe([]);
});

// -------------------------------------------------------------- analytics ----

test('analytics summarises internal events and leads', function () {
    $admin = lpUser();
    $page = lpPublished(['slug' => 'stats'], $admin);
    $this->get('/stats?utm_source=facebook');
    lpSubmit($this, 'stats')->assertOk();

    $data = $this->actingAs($admin)->get(route('admin.landing.analytics', ['page_id' => $page->id]))->assertOk()->viewData('page')['props']['data'];

    expect($data['totals']['page_views'])->toBe(1)
        ->and($data['totals']['leads'])->toBe(1)
        ->and($data['totals']['conversion_rate'])->toBe(100.0)
        ->and(collect($data['event_counts'])->pluck('event')->all())->toContain('PageView', 'Lead');
});

test('the shop templates include a working order form and guide the admin to pick products', function () {
    $admin = lpUser();
    $this->seed(\Database\Seeders\LandingPageTemplatesSeeder::class);

    foreach (['Electronics Product', 'Book Launch', 'E-commerce Sale', 'Wooden Craft Product (Bangla)', 'Product Checkout (Bangla)'] as $name) {
        $tpl = \App\Models\LandingPageTemplate::where('name', $name)->firstOrFail();
        $forms = \App\Landing\Builder\ContentTree::ofType($tpl->content_json, ['order_form']);
        expect($forms)->toHaveCount(1)
            ->and($forms[0]['settings']['css_id'])->toBe('order') // the "Order now" buttons link to #order
            ->and($forms[0]['content']['event_name'])->toBe('Purchase');

        $html = $this->get(\Illuminate\Support\Facades\URL::signedRoute('landing.template-preview', ['template' => $tpl->id]))->assertOk()->getContent();
        expect($html)->toContain('id="order"')->toContain('data-lp-order=');

        // a page made from it cannot be published until products are chosen
        $page = app(\App\Services\Landing\LandingPageService::class)->create(['title' => $name, 'slug' => \Illuminate\Support\Str::slug($name), 'template_id' => $tpl->id], $admin);
        $this->actingAs($admin)->postJson(route('admin.landing.publish', $page))->assertStatus(422)
            ->assertJsonPath('errors.publish.0', 'An order form has no valid products. Add at least one product to it.');
    }
});
