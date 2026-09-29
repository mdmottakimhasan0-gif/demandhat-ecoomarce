<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use App\Models\LandingPage;
use App\Models\LandingPageLead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LandingLeadController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', LandingPageLead::class);

        $paginator = $this->query($request)->with('landingPage:id,title,slug')->latest('created_at')->paginate(20)->withQueryString();

        return Inertia::render('Admin/LandingPages/Leads', [
            'leads' => $paginator->through(fn (LandingPageLead $l) => $this->row($l)),
            'filters' => $request->only('search', 'status', 'landing_page_id', 'source', 'from', 'to'),
            'pages' => LandingPage::orderBy('title')->get(['id', 'title']),
            'statuses' => LandingPageLead::STATUSES,
            'sources' => LandingPageLead::query()->whereNotNull('source')->distinct()->orderBy('source')->limit(100)->pluck('source'),
        ]);
    }

    public function show(LandingPageLead $lead)
    {
        Gate::authorize('view', $lead);
        $lead->load('landingPage:id,title,slug');

        return Inertia::render('Admin/LandingPages/LeadShow', [
            'lead' => $this->row($lead) + [
                'data' => $lead->data_json ?? [],
                'referrer' => $lead->referrer,
                'landing_url' => $lead->landing_url,
                'user_agent' => $lead->user_agent,
                'utm' => [
                    'utm_source' => $lead->utm_source, 'utm_medium' => $lead->utm_medium, 'utm_campaign' => $lead->utm_campaign,
                    'utm_term' => $lead->utm_term, 'utm_content' => $lead->utm_content,
                ],
            ],
            'statuses' => LandingPageLead::STATUSES,
        ]);
    }

    public function update(Request $request, LandingPageLead $lead)
    {
        Gate::authorize('update', $lead);
        $data = $request->validate(['status' => ['required', 'in:'.implode(',', LandingPageLead::STATUSES)]]);
        $lead->update($data);

        return back()->with('success', 'Lead updated.');
    }

    public function destroy(LandingPageLead $lead)
    {
        Gate::authorize('delete', $lead);
        $lead->delete();

        return redirect()->route('admin.landing.leads.index')->with('success', 'Lead deleted.');
    }

    public function export(Request $request): StreamedResponse
    {
        Gate::authorize('viewAny', LandingPageLead::class);
        $query = $this->query($request)->with('landingPage:id,title')->latest('created_at');

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Date', 'Landing page', 'Name', 'Email', 'Phone', 'Status', 'Source', 'UTM source', 'UTM medium', 'UTM campaign']);
            $query->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $l) {
                    // Prefix formula characters so spreadsheets do not execute them.
                    $safe = fn ($v) => is_string($v) && preg_match('/^[=+\-@\t\r]/', $v) ? "'".$v : $v;
                    fputcsv($out, array_map($safe, [
                        $l->created_at?->toDateTimeString(), $l->landingPage?->title, $l->name, $l->email, $l->phone,
                        $l->status, $l->source, $l->utm_source, $l->utm_medium, $l->utm_campaign,
                    ]));
                }
            });
            fclose($out);
        }, 'landing-leads-'.now()->format('Ymd').'.csv', ['Content-Type' => 'text/csv']);
    }

    private function query(Request $request)
    {
        return LandingPageLead::query()
            ->when($request->filled('search'), function ($q) use ($request) {
                $t = '%'.addcslashes((string) $request->string('search'), '%_\\').'%';
                $q->where(fn ($w) => $w->where('name', 'like', $t)->orWhere('email', 'like', $t)->orWhere('phone', 'like', $t));
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('landing_page_id'), fn ($q) => $q->where('landing_page_id', $request->integer('landing_page_id')))
            ->when($request->filled('source'), fn ($q) => $q->where('source', $request->string('source')))
            ->when($request->filled('from'), fn ($q) => $q->where('created_at', '>=', $request->date('from')->startOfDay()))
            ->when($request->filled('to'), fn ($q) => $q->where('created_at', '<=', $request->date('to')->endOfDay()));
    }

    private function row(LandingPageLead $l): array
    {
        return [
            'id' => $l->id, 'name' => $l->name, 'email' => $l->email, 'phone' => $l->phone, 'status' => $l->status,
            'source' => $l->source, 'utm_source' => $l->utm_source, 'utm_campaign' => $l->utm_campaign,
            'created_at' => $l->created_at?->toIso8601String(),
            'landing_page' => $l->landingPage ? ['id' => $l->landingPage->id, 'title' => $l->landingPage->title, 'slug' => $l->landingPage->slug] : null,
        ];
    }
}
