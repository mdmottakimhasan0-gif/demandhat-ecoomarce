<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Landing\StoreLeadRequest;
use App\Models\LandingPage;
use App\Models\LandingPageTemplate;
use App\Services\Landing\AttributionService;
use App\Services\Landing\LandingPageEventService;
use App\Services\Landing\LandingPageTrackingService;
use App\Services\Landing\LandingSlug;
use App\Services\Landing\LeadService;
use App\Services\Landing\PublicPageService;
use Illuminate\Http\Request;
use Inertia\Inertia;

/** Everything visitors touch. Nothing here requires authentication. */
class LandingPublicController extends Controller
{
    public function __construct(
        private PublicPageService $public,
        private AttributionService $attribution,
        private LandingPageTrackingService $tracking,
    ) {}

    /**
     * Registered as Route::fallback(): only reached when NO other application route matched,
     * so existing pages such as /about, /login or /admin can never be shadowed.
     */
    public function fallback(Request $request)
    {
        $slug = trim($request->path(), '/');
        if (strlen($slug) > 80 || ! preg_match(LandingSlug::PATTERN, $slug)) {
            abort(404);
        }

        try {
            $payload = $this->public->resolvePublished($slug);
        } catch (\Illuminate\Database\QueryException $e) {
            // Module not migrated yet (or DB down): behave exactly like before the module existed - a plain 404.
            if (str_contains($e->getMessage(), 'landing_pages') || str_contains($e->getMessage(), 'landing_page_versions')) {
                abort(404);
            }
            throw $e;
        }
        abort_if($payload === null, 404);

        // Attribution + visitor identity are captured before rendering.
        $this->attribution->capture($request, $slug, $payload['tracking']['utm']['enabled'] ?? true);
        $this->attribution->visitorHash($request, issue: true);

        $eventId = null;
        if (! AttributionService::isBot($request->userAgent())) {
            $eventId = LandingPageEventService::newEventId();
            // Logged + sent to CAPI after the response, so rendering never waits on Meta.
            app()->terminating(fn () => $this->tracking->pageLoad($payload['page_id'], $payload['tracking'], $eventId, $request));
        }

        return $this->respond($payload, $request, $eventId, indexable: true);
    }

    /** Signed, expiring draft preview. Never indexable, never cached. */
    public function preview(Request $request, LandingPage $landingPage)
    {
        $payload = $this->public->resolveDraft($landingPage);

        return $this->respond($payload, $request, null, indexable: false)
            ->header('X-Robots-Tag', 'noindex, nofollow')
            ->header('Cache-Control', 'no-store, private');
    }

    public function templatePreview(Request $request, LandingPageTemplate $template)
    {
        $payload = $this->public->resolveTemplate($template);

        return $this->respond($payload, $request, null, indexable: false)
            ->header('X-Robots-Tag', 'noindex, nofollow')
            ->header('Cache-Control', 'no-store, private');
    }

    private function respond(array $payload, Request $request, ?string $eventId, bool $indexable)
    {
        $data = $this->public->viewData($payload, $request, $eventId, $indexable);

        if ($data['layout'] === 'website') {
            return Inertia::render('Customer/LandingPageView', [
                'seo' => $data['seo'],
                'css' => $data['css'],
                'fontsUrl' => $data['fontsUrl'],
                'body' => $data['body'],
                'scripts' => $data['scripts'],
                'runtime' => $data['runtime'],
                'flags' => $data['flags'],
            ])->toResponse($request);
        }

        return response()->view('landing.public', $data);
    }

    // ---- POST endpoints -----------------------------------------------------

    public function submit(StoreLeadRequest $request, string $slug, LeadService $leads)
    {
        [$page, $version] = $this->publishedOr404($slug);

        try {
            $result = $leads->submit($page, $version, $request);
        } catch (\Illuminate\Validation\ValidationException|\Symfony\Component\HttpKernel\Exception\HttpExceptionInterface $e) {
            throw $e; // 422 with field errors / 404 for unknown forms
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['ok' => false, 'message' => 'Something went wrong. Please try again.'], 500);
        }

        return response()->json($result);
    }

    public function track(Request $request, string $slug)
    {
        [$page, $version] = $this->publishedOr404($slug);
        $request->validate([
            'kind' => ['required', 'in:click,pageview'],
            'element' => ['nullable', 'string', 'max:80'],
            'event_id' => ['nullable', 'string', 'max:64'],
            'url' => ['nullable', 'string', 'max:2000'],
        ]);

        if (AttributionService::isBot($request->userAgent())) {
            return response()->noContent();
        }

        try {
            $this->tracking->track($page, $version, $request);
        } catch (\Throwable $e) {
            report($e); // never surface tracking problems to visitors
        }

        return response()->noContent();
    }

    /** @return array{0:LandingPage,1:\App\Models\LandingPageVersion} */
    private function publishedOr404(string $slug): array
    {
        $page = LandingPage::published()->where('slug', $slug)->with('publishedVersion')->first();
        abort_if(! $page || ! $page->publishedVersion, 404);

        return [$page, $page->publishedVersion];
    }
}
