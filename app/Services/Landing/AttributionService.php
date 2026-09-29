<?php

namespace App\Services\Landing;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

/**
 * UTM / referrer attribution kept in the visitor's session and attached to leads and events.
 * Also owns the anonymous first-party visitor cookie used for "unique visitors".
 */
class AttributionService
{
    public const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

    private const SESSION_KEY = 'lp_attribution';

    /** Capture on landing page load. UTM params overwrite earlier ones; referrer is first-touch. */
    public function capture(Request $request, string $slug, bool $enabled = true): void
    {
        if (! $enabled || ! $request->hasSession()) {
            return;
        }

        $utm = [];
        foreach (self::UTM_KEYS as $key) {
            $v = $this->clean($request->query($key));
            if ($v !== null) {
                $utm[$key] = $v;
            }
        }
        $existing = $request->session()->get(self::SESSION_KEY);

        if (! $utm && $existing) {
            return;
        }

        $referrer = $this->externalReferrer($request);
        $fbclid = $this->clean($request->query('fbclid'), 200);

        $request->session()->put(self::SESSION_KEY, [
            'utm' => $utm ?: ($existing['utm'] ?? []),
            'referrer' => $existing['referrer'] ?? $referrer,
            'landing_url' => $request->fullUrl(),
            'landing_slug' => $slug,
            'fbc' => $fbclid ? 'fb.1.'.(time() * 1000).'.'.$fbclid : ($existing['fbc'] ?? null),
            'captured_at' => time(),
        ]);
    }

    /** Attribution for the current visitor (session), tolerating a missing session. */
    public function get(Request $request): array
    {
        return $request->hasSession() ? (array) $request->session()->get(self::SESSION_KEY, []) : [];
    }

    /**
     * Attribution for a lead: session first, then values the browser echoed back
     * (covers visitors who block cookies).
     */
    public function forLead(Request $request): array
    {
        $s = $this->get($request);
        $utm = $s['utm'] ?? [];
        foreach (self::UTM_KEYS as $key) {
            $utm[$key] ??= $this->clean($request->input($key));
        }

        return [
            'utm' => array_filter($utm),
            'referrer' => $s['referrer'] ?? $this->clean($request->input('referrer'), 2000),
            'landing_url' => $s['landing_url'] ?? $this->clean($request->input('landing_url'), 2000),
        ];
    }

    private function externalReferrer(Request $request): ?string
    {
        $ref = $request->headers->get('referer');
        if (! $ref) {
            return null;
        }
        $host = parse_url($ref, PHP_URL_HOST);

        return ($host && $host !== $request->getHost()) ? mb_substr($ref, 0, 2000) : null;
    }

    private function clean(mixed $v, int $max = 255): ?string
    {
        if (! is_string($v)) {
            return null;
        }
        $v = trim(preg_replace('/[\x00-\x1F\x7F]+/u', '', $v));

        return $v === '' ? null : mb_substr($v, 0, $max);
    }

    // ---- visitor identity ------------------------------------------------

    /** Returns the hashed visitor id, queueing the cookie if it does not exist yet. */
    public function visitorHash(Request $request, bool $issue = false): ?string
    {
        $vid = $request->cookie('lp_vid');
        if (! is_string($vid) || ! preg_match('/^[a-f0-9]{32}$/', $vid)) {
            if (! $issue) {
                return null;
            }
            $vid = bin2hex(random_bytes(16));
            Cookie::queue(Cookie::make('lp_vid', $vid, 60 * 24 * 365, '/', null, $request->isSecure(), true, false, 'lax'));
            // Make it available to the rest of this request.
            $request->cookies->set('lp_vid', $vid);
        }

        return hash_hmac('sha256', $vid, config('app.key'));
    }

    public static function ipHash(?string $ip): ?string
    {
        return $ip ? hash_hmac('sha256', $ip, config('app.key')) : null;
    }

    public static function isBot(?string $userAgent): bool
    {
        return (bool) preg_match('/bot|crawl|spider|slurp|facebookexternalhit|preview|headless|monitor|lighthouse|pingdom|curl|wget|python-requests|httpclient/i', (string) $userAgent);
    }
}
