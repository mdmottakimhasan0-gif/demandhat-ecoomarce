<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use App\Models\LandingPage;
use App\Services\Landing\LandingPageAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class LandingAnalyticsController extends Controller
{
    public function index(Request $request, LandingPageAnalyticsService $analytics)
    {
        Gate::authorize('landing_pages.analytics');

        $filters = $request->validate([
            'page_id' => ['nullable', 'integer'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'event' => ['nullable', 'string', 'max:60'],
        ]);

        return Inertia::render('Admin/LandingPages/Analytics', [
            'data' => $analytics->overview($filters),
            'filters' => $filters,
            'pages' => LandingPage::orderBy('title')->get(['id', 'title']),
            'events' => config('landing.tracking.standard_events'),
        ]);
    }
}
