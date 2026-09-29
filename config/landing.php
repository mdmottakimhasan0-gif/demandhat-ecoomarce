<?php

/*
|--------------------------------------------------------------------------
| Landing Page Builder
|--------------------------------------------------------------------------
| Secrets never live here. Landing-specific Meta credentials are stored
| encrypted in the database; the optional META_DEFAULT_* env values are
| server-side fallbacks only and are never sent to the browser.
*/

return [
    // Bump when the builder JSON schema changes; ContentNormalizer migrates old pages.
    'builder_version' => 1,

    'cache' => [
        'enabled' => env('LANDING_CACHE', true),
        'ttl' => (int) env('LANDING_CACHE_TTL', 3600),
    ],

    'preview_ttl_minutes' => (int) env('LANDING_PREVIEW_TTL', 60),

    'autosave_interval_ms' => 4000,

    'max_versions' => 50,

    'limits' => [
        'max_nodes' => 1500,
        'max_depth' => 14,
        'max_content_bytes' => 2 * 1024 * 1024,
    ],

    'container_widths' => [
        'default' => 1140,
        'options' => [1000, 1140, 1200, 1320],
    ],

    'media' => [
        'disk' => 'public',
        'directory' => 'landing',
        'max_kb' => (int) env('LANDING_MEDIA_MAX_KB', 4096),
        // SVG is intentionally not allowed: it can carry scripts.
        'mimes' => ['image/jpeg', 'image/png', 'image/webp'],
        'extensions' => ['jpg', 'jpeg', 'png', 'webp'],
    ],

    'tracking' => [
        'meta_api_version' => env('META_API_VERSION', 'v21.0'),
        'meta_default_pixel_id' => env('META_DEFAULT_PIXEL_ID'),
        'meta_default_access_token' => env('META_DEFAULT_ACCESS_TOKEN'),
        // after_response: run right after the HTTP response is sent (no worker needed)
        // queue: push to the configured queue (needs `php artisan queue:work`)
        'dispatch' => env('LANDING_TRACKING_DISPATCH', 'after_response'),
        // When true the browser tracker waits for window.LandingConsent.grant().
        'require_consent' => (bool) env('LANDING_REQUIRE_CONSENT', false),
        'standard_events' => [
            'PageView', 'ViewContent', 'Lead', 'Contact', 'CompleteRegistration',
            'AddToCart', 'InitiateCheckout', 'Purchase', 'Schedule', 'CustomEvent',
        ],
    ],

    'forms' => [
        'rate_limit_per_minute' => 10,
        'track_rate_limit_per_minute' => 120,
        'duplicate_window_seconds' => 60,
        'honeypot_field' => 'website_url',
    ],

    // Role => permissions. '*' grants everything. Sensitive ones (tracking, scripts,
    // delete) are limited to admin by default. Edit to suit your roles.
    'permissions' => [
        'admin' => ['*'],
        'manager' => [
            'landing_pages.view', 'landing_pages.create', 'landing_pages.edit',
            'landing_pages.publish', 'landing_pages.templates', 'landing_pages.leads',
            'landing_pages.analytics',
        ],
        'employee' => [],
    ],

    'all_permissions' => [
        'landing_pages.view', 'landing_pages.create', 'landing_pages.edit',
        'landing_pages.publish', 'landing_pages.delete', 'landing_pages.templates',
        'landing_pages.leads', 'landing_pages.analytics', 'landing_pages.tracking',
    ],

    // Slugs that can never be used because the application already owns them.
    // Existing application routes are ALSO detected dynamically.
    'reserved_slugs' => [
        'admin', 'api', 'storage', 'build', 'vendor', 'login', 'logout', 'register',
        'up', 'staff', 'verify-otp', 'cart', 'checkout', 'product', 'products', 'category',
        'categories', 'about', 'offers', 'dashboard', 'sanctum', 'livewire', 'horizon',
        'telescope', '_landing', 'favicon.ico', 'robots.txt', 'sitemap.xml', 'index.php',
    ],
];
