<?php

namespace App\Services\Landing;

use App\Jobs\SendMetaConversionEventJob;
use App\Models\LandingPage;
use App\Models\LandingPageEvent;
use App\Models\LandingPageEventDelivery;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Internal event log + delivery bookkeeping + CAPI dispatch.
 * One event_id is generated per event and shared by the browser Pixel call and the
 * server CAPI call so Meta can de-duplicate them.
 */
class LandingPageEventService
{
    public function __construct(private MetaPixelService $pixels, private AttributionService $attribution) {}

    /** Collision-resistant event id (UUID v4). */
    public static function newEventId(): string
    {
        return (string) Str::uuid();
    }

    /** Accept a browser generated id only if it is a sane token; otherwise mint one. */
    public static function acceptOrNewEventId(?string $candidate): string
    {
        return is_string($candidate) && preg_match('/^[A-Za-z0-9_-]{8,64}$/', $candidate) ? $candidate : self::newEventId();
    }

    /**
     * Idempotent on (page, event name, event id): a repeated beacon returns the same row.
     */
    public function record(LandingPage $page, string $name, string $eventId, string $source, ?string $elementId = null, array $metadata = [], ?Request $request = null): LandingPageEvent
    {
        $attr = $request ? $this->attribution->get($request) : [];

        return LandingPageEvent::firstOrCreate(
            ['landing_page_id' => $page->id, 'event_name' => $name, 'event_id' => $eventId],
            [
                'element_id' => $elementId,
                'source' => $source,
                'visitor_hash' => $request ? $this->attribution->visitorHash($request) : null,
                'utm_source' => $attr['utm']['utm_source'] ?? null,
                'metadata_json' => $metadata ?: null,
                'created_at' => now(),
            ]
        );
    }

    public function recordDelivery(LandingPageEvent $event, string $channel, string $status, ?int $code = null, ?string $error = null): LandingPageEventDelivery
    {
        return $event->deliveries()->create([
            'channel' => $channel,
            'status' => $status,
            'response_code' => $code,
            'error_message' => $error ? mb_substr($error, 0, 1000) : null,
            'sent_at' => $status === 'sent' ? now() : null,
            'created_at' => now(),
        ]);
    }

    /**
     * Hand an event to the CAPI pipeline. Never throws and never blocks the visitor:
     * by default it runs after the HTTP response is sent; set LANDING_TRACKING_DISPATCH=queue
     * to use the queue worker instead.
     *
     * @param  array  $rawUser  email/phone/name plus fbp/fbc (hashed here)
     * @param  bool  $deferred  true when the caller itself already runs after the response
     */
    public function sendToCapi(LandingPage $page, LandingPageEvent $row, array $tracking, string $eventName, string $eventId, string $sourceUrl, Request $request, array $rawUser = [], array $customData = [], bool $deferred = false): void
    {
        try {
            $config = $this->pixels->resolve($tracking, $page);
            if (! $config->capiEnabled) {
                $this->recordDelivery($row, 'capi', 'skipped', null, 'Conversions API is disabled for this page.');

                return;
            }
            if (! $config->serverAllows($eventName)) {
                $this->recordDelivery($row, 'capi', 'skipped', null, "Event {$eventName} is not enabled for server tracking.");

                return;
            }

            $attr = $this->attribution->get($request);
            $userData = MetaConversionsApiService::hashUserData($rawUser + [
                'client_ip_address' => $request->ip(),
                'client_user_agent' => substr((string) $request->userAgent(), 0, 500),
                'fbp' => $this->clean($request->cookie('_fbp') ?: $request->input('fbp')),
                'fbc' => $this->clean($request->cookie('_fbc') ?: $request->input('fbc')) ?: ($attr['fbc'] ?? null),
            ]);

            $event = [
                'event_name' => $eventName,
                'event_id' => $eventId,
                'event_time' => time(),
                'event_source_url' => $sourceUrl,
                'user_data' => $userData,
                'custom_data' => $customData,
            ];

            $job = new SendMetaConversionEventJob($page->id, $row->id, $event, $tracking);
            if (config('landing.tracking.dispatch') === 'queue') {
                dispatch($job);
            } elseif ($deferred) {
                dispatch_sync($job); // already running after the response was sent
            } else {
                dispatch($job)->afterResponse();
            }
        } catch (\Throwable $e) {
            // Tracking must never break page rendering or lead capture.
            report($e);
        }
    }

    private function clean(mixed $v): ?string
    {
        return is_string($v) && preg_match('/^[A-Za-z0-9._-]{4,200}$/', $v) ? $v : null;
    }
}
