<?php

namespace App\Services\Landing;

use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\ContentTree;
use App\Models\LandingPage;
use App\Models\LandingPageVersion;
use Illuminate\Http\Request;

/**
 * Turns page loads and element interactions into internal events, browser hand-offs
 * and CAPI deliveries - all sharing one event_id so Meta can de-duplicate.
 */
class LandingPageTrackingService
{
    public function __construct(
        private LandingPageEventService $events,
        private MetaPixelService $pixels,
    ) {}

    /**
     * Runs after the response is sent. Never throws.
     */
    public function pageLoad(int $pageId, array $tracking, string $eventId, Request $request): void
    {
        try {
            $page = LandingPage::find($pageId);
            if (! $page) {
                return;
            }
            $config = $this->pixels->resolve($tracking, $page);
            $consent = (bool) config('landing.tracking.require_consent');
            $url = $request->fullUrl();

            // PageView is always logged internally; ViewContent only when configured.
            $names = ['PageView'];
            if ($config->browserAllows('ViewContent') || ($config->capiEnabled && ($config->capiEvents['ViewContent'] ?? false))) {
                $names[] = 'ViewContent';
            }

            foreach ($names as $name) {
                $row = $this->events->record($page, $name, $eventId, 'pageload', null, [], $request);
                if (! $row->wasRecentlyCreated) {
                    continue;
                }
                $config->browserAllows($name)
                    ? $this->events->recordDelivery($row, 'browser', 'sent')
                    : $this->events->recordDelivery($row, 'browser', 'skipped', null, 'Pixel disabled or event not enabled.');

                if ($consent) {
                    // Server events wait for the browser to report consent (see track()).
                    continue;
                }
                if ($config->capiEnabled) {
                    $this->events->sendToCapi($page, $row, $tracking, $name, $eventId, $url, $request, deferred: true);
                }
            }
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * A form / order submission: internal event + browser hand-off + CAPI, all with one event_id.
     * Best effort: the lead/order is already saved, so nothing here may throw.
     *
     * @param  array  $user  raw name/email/phone (hashed before leaving the server)
     * @param  array  $custom  Meta custom_data (value, currency, contents ...) - also echoed to the browser
     * @return array{name:string,id:string,browser:bool,custom:array}|null
     */
    public function submission(LandingPage $page, LandingPageVersion $version, ?array $cfg, Request $request, array $user, array $custom = [], array $meta = []): ?array
    {
        if (! $cfg) {
            return null;
        }
        try {
            $tracking = $version->tracking_json ?? [];
            $config = $this->pixels->resolve($tracking, $page);
            $eventId = LandingPageEventService::acceptOrNewEventId($request->input('event_id'));
            $url = mb_substr((string) ($request->input('landing_url') ?: $page->publicUrl()), 0, 2000);

            $row = $this->events->record($page, $cfg['event'], $eventId, 'form_submit', $cfg['element_id'], ['form' => $cfg['element_id']] + $meta, $request);
            $browser = $cfg['browser'] && $config->browserAllows($cfg['event']);
            $this->events->recordDelivery($row, 'browser', $browser ? 'sent' : 'skipped', null, $browser ? null : 'Browser tracking off for this form/event.');

            if ($cfg['server']) {
                $this->events->sendToCapi($page, $row, $tracking, $cfg['event'], $eventId, $url, $request, $user, $custom);
            } else {
                $this->events->recordDelivery($row, 'capi', 'skipped', null, 'Server tracking off for this form.');
            }

            // The browser fires fbq with THIS id, so Meta de-duplicates against the CAPI event.
            return ['name' => $cfg['event'], 'id' => $eventId, 'browser' => $browser, 'custom' => $custom];
        } catch (\Throwable $e) {
            report($e);

            return null;
        }
    }

    /**
     * Beacon from the browser tracker. The event name is looked up in the PUBLISHED page,
     * so visitors cannot invent events.
     *
     * @return array{ok:bool}
     */
    public function track(LandingPage $page, ?LandingPageVersion $version, Request $request): array
    {
        $kind = $request->input('kind');
        $eventId = LandingPageEventService::acceptOrNewEventId($request->input('event_id'));
        $tracking = $version?->tracking_json ?? $page->tracking_json ?? [];
        $config = $this->pixels->resolve($tracking, $page);
        $url = mb_substr((string) ($request->input('url') ?: $request->headers->get('referer') ?: $page->publicUrl()), 0, 2000);

        if ($kind === 'pageview') {
            // Only used when consent gating delayed the server side PageView.
            $row = $this->events->record($page, 'PageView', $eventId, 'pageload', null, [], $request);
            $this->events->sendToCapi($page, $row, $tracking, 'PageView', $eventId, $url, $request);

            return ['ok' => true];
        }

        if ($kind !== 'click') {
            return ['ok' => false];
        }

        $node = ContentTree::findSafe($version?->content_json ?? $page->content_json ?? [], AbstractElement::safeId((string) $request->input('element')));
        $cfg = $node ? AbstractElement::trackingConfig($node, 'click') : null;
        if (! $cfg) {
            return ['ok' => false];
        }

        $row = $this->events->record($page, $cfg['event'], $eventId, 'click', $cfg['element_id'], ['type' => $cfg['type']], $request);
        if (! $row->wasRecentlyCreated) {
            return ['ok' => true];
        }

        $cfg['browser'] && $config->browserAllows($cfg['event'])
            ? $this->events->recordDelivery($row, 'browser', 'sent')
            : $this->events->recordDelivery($row, 'browser', 'skipped', null, 'Browser tracking off for this element/event.');

        if ($cfg['server']) {
            $this->events->sendToCapi($page, $row, $tracking, $cfg['event'], $eventId, $url, $request);
        } else {
            $this->events->recordDelivery($row, 'capi', 'skipped', null, 'Server tracking off for this element.');
        }

        return ['ok' => true];
    }
}
