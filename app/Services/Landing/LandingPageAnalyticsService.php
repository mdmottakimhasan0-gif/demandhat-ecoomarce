<?php

namespace App\Services\Landing;

use App\Models\LandingPageEvent;
use App\Models\LandingPageEventDelivery;
use App\Models\LandingPageLead;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * First-party analytics computed from the internal event log and the leads table.
 * These are INTERNAL events - they are not Meta Ads metrics.
 */
class LandingPageAnalyticsService
{
    /** @param  array{page_id?:?int,from?:?string,to?:?string,event?:?string}  $f */
    public function overview(array $f): array
    {
        [$from, $to] = $this->range($f);
        $events = fn () => $this->events($f, $from, $to);
        $leads = fn () => $this->leads($f, $from, $to);

        $views = (clone $events())->where('event_name', 'PageView')->count();
        $uniques = (clone $events())->where('event_name', 'PageView')->whereNotNull('visitor_hash')->distinct()->count('visitor_hash');
        $leadCount = $leads()->count();
        $clicks = (clone $events())->where('source', 'click')->count();
        $base = $uniques > 0 ? $uniques : $views;

        return [
            'range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'totals' => [
                'page_views' => $views,
                'unique_visitors' => $uniques,
                'leads' => $leadCount,
                'form_submissions' => $leadCount,
                'button_clicks' => $clicks,
                'conversion_rate' => $base > 0 ? round($leadCount / $base * 100, 2) : 0,
            ],
            'event_counts' => (clone $events())->select('event_name', DB::raw('count(*) as total'))
                ->groupBy('event_name')->orderByDesc('total')->get()->map(fn ($r) => ['event' => $r->event_name, 'total' => (int) $r->total])->all(),
            'top_sources' => $this->topSources($f, $from, $to),
            'daily' => $this->daily($f, $from, $to),
            'deliveries' => $this->deliverySummary($f, $from, $to),
        ];
    }

    /** @return array<int,array{views:int,leads:int}> keyed by landing page id */
    public function totalsByPage(array $pageIds): array
    {
        if (! $pageIds) {
            return [];
        }
        $views = LandingPageEvent::whereIn('landing_page_id', $pageIds)->where('event_name', 'PageView')
            ->select('landing_page_id', DB::raw('count(*) as c'))->groupBy('landing_page_id')->pluck('c', 'landing_page_id');
        $leads = LandingPageLead::whereIn('landing_page_id', $pageIds)
            ->select('landing_page_id', DB::raw('count(*) as c'))->groupBy('landing_page_id')->pluck('c', 'landing_page_id');

        $out = [];
        foreach ($pageIds as $id) {
            $out[$id] = ['views' => (int) ($views[$id] ?? 0), 'leads' => (int) ($leads[$id] ?? 0)];
        }

        return $out;
    }

    private function range(array $f): array
    {
        $to = ! empty($f['to']) ? Carbon::parse($f['to'])->endOfDay() : now()->endOfDay();
        $from = ! empty($f['from']) ? Carbon::parse($f['from'])->startOfDay() : $to->copy()->subDays(29)->startOfDay();

        return [$from, $to];
    }

    private function events(array $f, Carbon $from, Carbon $to): Builder
    {
        return LandingPageEvent::query()
            ->whereBetween('created_at', [$from, $to])
            ->when(! empty($f['page_id']), fn ($q) => $q->where('landing_page_id', $f['page_id']))
            ->when(! empty($f['event']), fn ($q) => $q->where('event_name', $f['event']));
    }

    private function leads(array $f, Carbon $from, Carbon $to): Builder
    {
        return LandingPageLead::query()
            ->whereBetween('created_at', [$from, $to])
            ->when(! empty($f['page_id']), fn ($q) => $q->where('landing_page_id', $f['page_id']));
    }

    private function topSources(array $f, Carbon $from, Carbon $to): array
    {
        $views = $this->events($f, $from, $to)->where('event_name', 'PageView')->whereNotNull('utm_source')
            ->select('utm_source', DB::raw('count(*) as c'))->groupBy('utm_source')->pluck('c', 'utm_source');
        $leads = $this->leads($f, $from, $to)->whereNotNull('utm_source')
            ->select('utm_source', DB::raw('count(*) as c'))->groupBy('utm_source')->pluck('c', 'utm_source');

        $rows = [];
        foreach ($views->keys()->merge($leads->keys())->unique() as $src) {
            $rows[] = ['source' => $src, 'views' => (int) ($views[$src] ?? 0), 'leads' => (int) ($leads[$src] ?? 0)];
        }
        usort($rows, fn ($a, $b) => [$b['leads'], $b['views']] <=> [$a['leads'], $a['views']]);

        return array_slice($rows, 0, 10);
    }

    private function daily(array $f, Carbon $from, Carbon $to): array
    {
        $views = $this->events($f, $from, $to)->where('event_name', 'PageView')
            ->select(DB::raw('DATE(created_at) as d'), DB::raw('count(*) as c'))->groupBy('d')->pluck('c', 'd');
        $leads = $this->leads($f, $from, $to)
            ->select(DB::raw('DATE(created_at) as d'), DB::raw('count(*) as c'))->groupBy('d')->pluck('c', 'd');

        $out = [];
        for ($d = $from->copy(); $d <= $to; $d->addDay()) {
            $key = $d->toDateString();
            $out[] = ['date' => $key, 'views' => (int) ($views[$key] ?? 0), 'leads' => (int) ($leads[$key] ?? 0)];
        }

        return $out;
    }

    private function deliverySummary(array $f, Carbon $from, Carbon $to): array
    {
        $rows = LandingPageEventDelivery::query()
            ->whereBetween('created_at', [$from, $to])
            ->when(! empty($f['page_id']), fn ($q) => $q->whereHas('event', fn ($e) => $e->where('landing_page_id', $f['page_id'])))
            ->select('channel', 'status', DB::raw('count(*) as c'))->groupBy('channel', 'status')->get();

        $out = [];
        foreach ($rows as $r) {
            $out[$r->channel][$r->status] = (int) $r->c;
        }

        return $out;
    }
}
