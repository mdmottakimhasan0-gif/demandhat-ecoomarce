<?php

use App\Landing\Builder\ContentNormalizer;
use App\Models\LandingPage;
use App\Models\User;
use App\Services\Landing\LandingPageService;
use App\Services\Landing\TrackingConfig;

/** Shared helpers for the landing page builder tests. */
function lpUser(string $role = 'admin'): User
{
    return User::factory()->create(['role' => $role]);
}

function lpNode(string $type, array $content = [], array $settings = [], array $children = [], ?string $id = null): array
{
    return [
        'id' => $id ?? ContentNormalizer::newId($type),
        'type' => $type,
        'content' => $content,
        'settings' => $settings,
        'children' => $children,
    ];
}

function lpFormNode(array $content = [], string $id = 'form_testform01'): array
{
    return lpNode('form', array_merge([
        'fields' => [
            ['type' => 'name', 'label' => 'Name', 'name' => 'name', 'required' => true],
            ['type' => 'email', 'label' => 'Email', 'name' => 'email', 'required' => true],
            ['type' => 'phone', 'label' => 'Phone', 'name' => 'phone', 'required' => false],
        ],
        'submit_text' => 'Send',
        'success_message' => 'Thanks a lot!',
        'save_lead' => true,
        'event_enabled' => true,
        'event_name' => 'Lead',
        'event_browser' => true,
        'event_server' => true,
    ], $content), [], [], $id);
}

/** section > container > heading + button + form */
function lpContent(string $heading = 'Grow Your Business', array $extra = []): array
{
    return [
        'version' => 1,
        'sections' => [
            lpNode('section', ['content_width' => 'boxed'], [], [
                lpNode('container', [], [], array_merge([
                    lpNode('heading', ['text' => $heading, 'tag' => 'h1'], [], [], 'heading_testhead01'),
                    lpNode('button', ['text' => 'Book Consultation', 'url' => '#form', 'event_enabled' => true, 'event_name' => 'Contact', 'event_browser' => true, 'event_server' => true], [], [], 'button_testbtn001'),
                    lpFormNode(),
                ], $extra)),
            ]),
        ],
    ];
}

function lpPage(array $attrs = [], ?User $user = null): LandingPage
{
    $user ??= lpUser();
    $service = app(LandingPageService::class);
    $page = $service->create([
        'title' => $attrs['title'] ?? 'Test Landing',
        'slug' => $attrs['slug'] ?? 'test-landing',
    ], $user);

    $service->saveDraft($page, ['content' => $attrs['content'] ?? lpContent()], $user, snapshot: true);

    return $page->refresh();
}

function lpPublished(array $attrs = [], ?User $user = null): LandingPage
{
    $user ??= lpUser();
    $page = lpPage($attrs, $user);

    return app(LandingPageService::class)->publish($page, $user)->refresh();
}

function lpSubmit($test, string $slug, array $data = [], array $headers = [])
{
    return $test->postJson("/_landing/{$slug}/submit", array_merge([
        'form' => 'form_testform01',
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'phone' => '+1 555 123 4567',
    ], $data), $headers);
}

/** Decode the window.__LP runtime config embedded in a public page. */
function lpRuntime(string $html): array
{
    preg_match("/window\\.__LP=JSON\\.parse\\('(.*?)'\\);<\\/script>/s", $html, $m);

    return json_decode(json_decode('"'.$m[1].'"', true), true);
}

function lpEnableCapi(\App\Models\LandingPage $page, array $extra = []): \App\Models\LandingPage
{
    $tracking = TrackingConfig::normalize(array_replace_recursive([
        'meta' => ['enabled' => true, 'use_global' => false, 'pixel_id' => '111222333', 'events' => ['PageView' => true, 'Lead' => true, 'Contact' => true, 'Purchase' => true]],
        'capi' => ['enabled' => true, 'use_global' => false, 'pixel_id' => '111222333', 'test_event_code' => 'TEST123', 'events' => ['PageView' => true, 'Lead' => true, 'Contact' => true, 'Purchase' => true]],
    ], $extra));
    $page->forceFill(['tracking_json' => $tracking])->save();
    $page->capi_access_token = 'EAAB-super-secret-token-value';
    $page->save();

    return app(\App\Services\Landing\LandingPageService::class)->publish($page->refresh(), lpUser());
}
