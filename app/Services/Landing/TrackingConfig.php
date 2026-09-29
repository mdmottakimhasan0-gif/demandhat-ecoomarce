<?php

namespace App\Services\Landing;

/**
 * Shape of a page's tracking_json (safe to snapshot, never holds secrets).
 * The CAPI access token lives in landing_pages.capi_access_token (encrypted).
 */
class TrackingConfig
{
    public static function defaultEvents(): array
    {
        $events = array_fill_keys(config('landing.tracking.standard_events'), false);
        $events['PageView'] = true;
        $events['Lead'] = true;
        $events['Contact'] = true;
        $events['Purchase'] = true; // fired only by the Order Form, so on by default

        return $events;
    }

    public static function defaults(): array
    {
        return [
            'meta' => ['enabled' => true, 'use_global' => false, 'pixel_id' => '', 'events' => self::defaultEvents()],
            'capi' => ['enabled' => false, 'use_global' => false, 'pixel_id' => '', 'test_event_code' => '', 'api_version' => '', 'events' => self::defaultEvents()],
            'utm' => ['enabled' => true],
            'scripts' => ['head' => '', 'body_start' => '', 'body_end' => ''],
        ];
    }

    /**
     * @param  bool  $allowScripts  scripts require landing_pages.tracking; otherwise the previous value is kept
     */
    public static function normalize(?array $in, ?array $previous = null, bool $allowScripts = true): array
    {
        $d = self::defaults();
        $in ??= [];
        $prev = array_replace_recursive($d, $previous ?? []);

        $events = function (mixed $given) {
            $out = self::defaultEvents();
            foreach ((array) $given as $name => $on) {
                if (array_key_exists($name, $out)) {
                    $out[$name] = (bool) $on;
                }
            }

            return $out;
        };
        $pixel = fn ($v) => substr(preg_replace('/\D/', '', (string) $v), 0, 20);

        $meta = (array) ($in['meta'] ?? []);
        $capi = (array) ($in['capi'] ?? []);

        $out = [
            'meta' => [
                'enabled' => (bool) ($meta['enabled'] ?? $d['meta']['enabled']),
                'use_global' => (bool) ($meta['use_global'] ?? $d['meta']['use_global']),
                'pixel_id' => $pixel($meta['pixel_id'] ?? ''),
                'events' => $events($meta['events'] ?? []),
            ],
            'capi' => [
                'enabled' => (bool) ($capi['enabled'] ?? $d['capi']['enabled']),
                'use_global' => (bool) ($capi['use_global'] ?? $d['capi']['use_global']),
                'pixel_id' => $pixel($capi['pixel_id'] ?? ''),
                'test_event_code' => substr(preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($capi['test_event_code'] ?? '')), 0, 40),
                'api_version' => preg_match('/^v\d{1,2}\.\d$/', (string) ($capi['api_version'] ?? '')) ? $capi['api_version'] : '',
                'events' => $events($capi['events'] ?? []),
            ],
            'utm' => ['enabled' => (bool) (($in['utm']['enabled'] ?? true))],
        ];

        $out['scripts'] = $allowScripts
            ? [
                'head' => mb_substr((string) ($in['scripts']['head'] ?? ''), 0, 50000),
                'body_start' => mb_substr((string) ($in['scripts']['body_start'] ?? ''), 0, 50000),
                'body_end' => mb_substr((string) ($in['scripts']['body_end'] ?? ''), 0, 50000),
            ]
            : $prev['scripts'];

        return $out;
    }
}
