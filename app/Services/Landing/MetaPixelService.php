<?php

namespace App\Services\Landing;

use App\Models\LandingPage;
use App\Models\LandingPageSetting;

/** Resolves the effective Pixel + CAPI configuration for a page. */
class MetaPixelService
{
    /**
     * @param  array  $tracking  the page's tracking_json (draft or a published snapshot)
     * @param  LandingPage|null  $page  needed only to read the page's own encrypted token
     * @param  bool  $withSecrets  load the access token (job / server-side sending only)
     */
    public function resolve(array $tracking, ?LandingPage $page = null, bool $withSecrets = false): MetaConfig
    {
        $t = array_replace_recursive(TrackingConfig::defaults(), $tracking);
        $meta = $t['meta'];
        $capi = $t['capi'];

        $globalPixel = LandingPageSetting::publicValue('meta.pixel_id') ?: config('landing.tracking.meta_default_pixel_id');
        $globalEnabled = LandingPageSetting::publicValue('meta.enabled', '1') !== '0';

        // Browser pixel
        $pixel = $meta['use_global'] ? $globalPixel : ($meta['pixel_id'] ?: null);
        $browserEnabled = (bool) $meta['enabled'] && ($meta['use_global'] ? $globalEnabled : true) && $pixel;

        // Conversions API
        $globalCapi = LandingPageSetting::publicValue('meta.capi_enabled', '0') === '1';
        $capiEnabled = $capi['use_global'] ? ($globalCapi && (bool) $capi['enabled']) : (bool) $capi['enabled'];
        $capiPixel = $capi['use_global'] ? $globalPixel : ($capi['pixel_id'] ?: $pixel);

        $version = $capi['api_version'] ?: (LandingPageSetting::publicValue('meta.api_version') ?: config('landing.tracking.meta_api_version'));
        $test = $capi['use_global'] ? LandingPageSetting::publicValue('meta.test_event_code') : $capi['test_event_code'];

        // A landing with its own settings uses ONLY its own token (never another landing's or the
        // global one, which would belong to a different pixel). Global mode uses global/env.
        $token = null;
        if ($withSecrets && $capiEnabled) {
            $token = $capi['use_global']
                ? (LandingPageSetting::get('meta.access_token') ?: config('landing.tracking.meta_default_access_token'))
                : ($page && $page->hasCapiToken() ? $page->capi_access_token : null);
        }

        return new MetaConfig(
            browserEnabled: (bool) $browserEnabled,
            pixelId: $pixel ?: null,
            browserEvents: $meta['events'],
            capiEnabled: $capiEnabled,
            capiPixelId: $capiPixel ?: null,
            capiEvents: $capi['events'],
            apiVersion: $version,
            testEventCode: $test ?: null,
            accessToken: $token ?: null,
        );
    }
}
