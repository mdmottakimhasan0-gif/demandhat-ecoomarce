<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use App\Landing\Builder\AbstractElement;
use App\Landing\Builder\ContentTree;
use App\Models\LandingPage;
use App\Models\LandingPageEvent;
use App\Services\Landing\MetaPixelService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

/** Event manager: which events each page is configured to send, plus the delivery log. */
class LandingEventController extends Controller
{
    public function index(Request $request, MetaPixelService $pixels)
    {
        Gate::authorize('landing_pages.analytics');

        $configured = [];
        foreach (LandingPage::orderBy('title')->get() as $page) {
            $config = $pixels->resolve($page->tracking_json ?? []);

            // Page level events
            foreach (['PageView', 'ViewContent'] as $name) {
                $configured[] = [
                    'event' => $name, 'trigger' => 'page load', 'page_id' => $page->id, 'page' => $page->title, 'element' => '-',
                    'pixel' => $config->pixelId, 'browser' => $config->browserAllows($name),
                    'server' => $config->capiEnabled && ($config->capiEvents[$name] ?? false),
                    'status' => $page->isPublished() ? 'live' : $page->status,
                ];
            }
            // Element level events
            ContentTree::walk($page->content_json ?? [], function ($node) use (&$configured, $page, $config) {
                $cfg = AbstractElement::trackingConfig($node, $node['type'] === 'form' ? 'submit' : 'click');
                if (! $cfg) {
                    return;
                }
                $configured[] = [
                    'event' => $cfg['event'], 'trigger' => $cfg['trigger'], 'page_id' => $page->id, 'page' => $page->title,
                    'element' => ucfirst(str_replace('_', ' ', $node['type'])).' ('.substr($cfg['element_id'], -6).')',
                    'pixel' => $config->pixelId,
                    'browser' => $cfg['browser'] && $config->browserAllows($cfg['event']),
                    'server' => $cfg['server'] && $config->capiEnabled && ($config->capiEvents[$cfg['event']] ?? true),
                    'status' => $page->isPublished() ? 'live' : $page->status,
                ];
            });
        }

        $log = LandingPageEvent::query()
            ->with(['landingPage:id,title', 'deliveries'])
            ->when($request->filled('page_id'), fn ($q) => $q->where('landing_page_id', $request->integer('page_id')))
            ->when($request->filled('event'), fn ($q) => $q->where('event_name', $request->string('event')))
            ->when($request->filled('source'), fn ($q) => $q->where('source', $request->string('source')))
            ->latest('created_at')->paginate(25)->withQueryString();

        return Inertia::render('Admin/LandingPages/Events', [
            'configured' => $configured,
            'log' => $log->through(fn (LandingPageEvent $e) => [
                'id' => $e->id, 'event' => $e->event_name, 'event_id' => $e->event_id, 'source' => $e->source,
                'element_id' => $e->element_id, 'page' => $e->landingPage?->title, 'created_at' => $e->created_at?->toIso8601String(),
                'deliveries' => $e->deliveries->map(fn ($d) => [
                    'channel' => $d->channel, 'status' => $d->status, 'code' => $d->response_code, 'error' => $d->error_message,
                ]),
            ]),
            'filters' => $request->only('page_id', 'event', 'source'),
            'pages' => LandingPage::orderBy('title')->get(['id', 'title']),
            'events' => config('landing.tracking.standard_events'),
        ]);
    }
}
