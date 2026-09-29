<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use App\Landing\Support\Sanitizer;
use App\Models\LandingPageSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

/** Global (module wide) tracking + builder settings. */
class LandingSettingsController extends Controller
{
    public function tracking()
    {
        Gate::authorize('landing_pages.tracking');

        return Inertia::render('Admin/LandingPages/Tracking', [
            'settings' => [
                'enabled' => LandingPageSetting::publicValue('meta.enabled', '1') !== '0',
                'pixel_id' => LandingPageSetting::publicValue('meta.pixel_id', ''),
                'capi_enabled' => LandingPageSetting::publicValue('meta.capi_enabled', '0') === '1',
                'test_event_code' => LandingPageSetting::publicValue('meta.test_event_code', ''),
                'api_version' => LandingPageSetting::publicValue('meta.api_version', config('landing.tracking.meta_api_version')),
                // Presence only. The token is write-only and never sent to the browser.
                'has_access_token' => LandingPageSetting::has('meta.access_token'),
                'env_pixel_id' => (bool) config('landing.tracking.meta_default_pixel_id'),
                'env_access_token' => (bool) config('landing.tracking.meta_default_access_token'),
            ],
            'dispatch' => config('landing.tracking.dispatch'),
            'requireConsent' => (bool) config('landing.tracking.require_consent'),
        ]);
    }

    public function updateTracking(Request $request)
    {
        Gate::authorize('landing_pages.tracking');
        $data = $request->validate([
            'enabled' => ['required', 'boolean'],
            'pixel_id' => ['nullable', 'regex:/^\d{5,20}$/'],
            'capi_enabled' => ['required', 'boolean'],
            'test_event_code' => ['nullable', 'regex:/^[A-Za-z0-9_-]{1,40}$/'],
            'api_version' => ['required', 'regex:/^v\d{1,2}\.\d$/'],
            'access_token' => ['nullable', 'string', 'max:1000'],
            'clear_access_token' => ['sometimes', 'boolean'],
        ]);

        LandingPageSetting::put('meta.enabled', $data['enabled'] ? '1' : '0');
        LandingPageSetting::put('meta.pixel_id', $data['pixel_id'] ?? '');
        LandingPageSetting::put('meta.capi_enabled', $data['capi_enabled'] ? '1' : '0');
        LandingPageSetting::put('meta.test_event_code', $data['test_event_code'] ?? '');
        LandingPageSetting::put('meta.api_version', $data['api_version']);

        if (! empty($data['clear_access_token'])) {
            LandingPageSetting::put('meta.access_token', null, true);
        } elseif (filled($data['access_token'] ?? null)) {
            LandingPageSetting::put('meta.access_token', $data['access_token'], true);
        }

        return back()->with('success', 'Tracking settings saved.');
    }

    public function settings()
    {
        Gate::authorize('landing_pages.tracking');

        return Inertia::render('Admin/LandingPages/Settings', [
            'settings' => [
                'container_width' => (int) LandingPageSetting::publicValue('builder.container_width', config('landing.container_widths.default')),
                'font_family' => LandingPageSetting::publicValue('builder.font_family', ''),
            ],
            'widths' => config('landing.container_widths.options'),
            'fonts' => array_keys(Sanitizer::fontStacks()),
            'limits' => [
                'max_media_kb' => config('landing.media.max_kb'),
                'cache_ttl' => config('landing.cache.ttl'),
                'max_versions' => config('landing.max_versions'),
                'autosave_ms' => config('landing.autosave_interval_ms'),
            ],
        ]);
    }

    public function updateSettings(Request $request)
    {
        Gate::authorize('landing_pages.tracking');
        $data = $request->validate([
            'container_width' => ['required', 'integer', 'min:320', 'max:2400'],
            'font_family' => ['nullable', 'string', 'max:60'],
        ]);

        LandingPageSetting::put('builder.container_width', (string) $data['container_width']);
        LandingPageSetting::put('builder.font_family', Sanitizer::fontFamily($data['font_family'] ?? '') ? $data['font_family'] : '');

        return back()->with('success', 'Settings saved.');
    }
}
