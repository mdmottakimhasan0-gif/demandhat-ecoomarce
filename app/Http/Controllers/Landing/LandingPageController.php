<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Landing\PublishLandingPageRequest;
use App\Http\Requests\Landing\StoreLandingPageRequest;
use App\Http\Requests\Landing\UpdateLandingPageRequest;
use App\Http\Requests\Landing\UpdateTrackingRequest;
use App\Landing\Builder\ContentNormalizer;
use App\Landing\Builder\ElementRegistry;
use App\Landing\Builder\Exceptions\InvalidBuilderContent;
use App\Landing\Builder\LandingPageRenderer;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;
use App\Models\LandingPage;
use App\Models\LandingPageSetting;
use App\Models\LandingPageTemplate;
use App\Models\LandingPageVersion;
use App\Services\Landing\LandingPageAnalyticsService;
use App\Services\Landing\LandingPagePresenter;
use App\Services\Landing\LandingPageService;
use App\Services\Landing\LandingPageVersionService;
use App\Services\Landing\LandingPermissions;
use App\Services\Landing\LandingSlug;
use App\Services\Landing\PageMeta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class LandingPageController extends Controller
{
    public function __construct(
        private LandingPageService $pages,
        private LandingPageVersionService $versions,
    ) {}

    public function index(Request $request, LandingPageAnalyticsService $analytics)
    {
        Gate::authorize('viewAny', LandingPage::class);

        $q = LandingPage::query()
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), function ($q) use ($request) {
                $term = '%'.addcslashes((string) $request->string('search'), '%_\\').'%';
                $q->where(fn ($w) => $w->where('title', 'like', $term)->orWhere('slug', 'like', $term));
            })
            ->when($request->filled('from'), fn ($q) => $q->whereDate('updated_at', '>=', $request->date('from')))
            ->when($request->filled('to'), fn ($q) => $q->whereDate('updated_at', '<=', $request->date('to')))
            ->latest('updated_at');

        $paginator = $q->paginate(15)->withQueryString();
        $totals = $analytics->totalsByPage($paginator->pluck('id')->all());

        return Inertia::render('Admin/LandingPages/Index', [
            'pages' => $paginator->through(fn (LandingPage $p) => LandingPagePresenter::row($p) + $totals[$p->id]),
            'filters' => $request->only('status', 'search', 'from', 'to'),
            'can' => LandingPermissions::for($request->user()),
        ]);
    }

    public function create(Request $request)
    {
        Gate::authorize('create', LandingPage::class);

        return Inertia::render('Admin/LandingPages/Create', [
            'templates' => LandingPageTemplate::query()->where('is_public', true)->orderBy('category')->orderBy('name')
                ->get(['id', 'name', 'description', 'category', 'thumbnail']),
            'categories' => LandingPageTemplate::CATEGORIES,
            'selectedTemplate' => $request->integer('template') ?: null,
        ]);
    }

    public function store(StoreLandingPageRequest $request)
    {
        $page = $this->pages->create($request->validated(), $request->user());

        return redirect()->route('admin.landing.builder', $page)->with('success', 'Landing page created.');
    }

    public function builder(Request $request, LandingPage $landingPage, ElementRegistry $registry)
    {
        Gate::authorize('update', $landingPage);
        $user = $request->user();

        return Inertia::render('Admin/LandingPages/Builder', [
            'page' => LandingPagePresenter::builder($landingPage),
            'content' => $landingPage->content_json ?? ContentNormalizer::emptyContent(),
            'settings' => array_replace(PageMeta::settingsDefaults(), $landingPage->settings_json ?? []),
            'seo' => array_replace(PageMeta::seoDefaults(), $landingPage->seo_json ?? []),
            'tracking' => LandingPagePresenter::tracking($landingPage, LandingPermissions::allows($user, 'landing_pages.tracking')),
            'schema' => $registry->schema(),
            'can' => LandingPermissions::for($user),
            'urls' => [
                'back' => route('admin.landing.index'),
                'canvas' => route('admin.landing.canvas', $landingPage),
                'render' => route('admin.landing.render', $landingPage),
                'save' => route('admin.landing.save', $landingPage),
                'autosave' => route('admin.landing.autosave', $landingPage),
                'publish' => route('admin.landing.publish', $landingPage),
                'unpublish' => route('admin.landing.unpublish', $landingPage),
                'previewLink' => route('admin.landing.preview-link', $landingPage),
                'versions' => route('admin.landing.versions', $landingPage),
                'tracking' => route('admin.landing.tracking.update', $landingPage),
                'saveTemplate' => route('admin.landing.templates.store'),
                'mediaList' => route('admin.landing.media.list'),
                'mediaUpload' => route('admin.landing.media.store'),
                'productSearch' => route('admin.landing.products.search'),
                'analytics' => route('admin.landing.analytics', ['page_id' => $landingPage->id]),
                'export' => route('admin.landing.export', $landingPage),
            ],
            'config' => [
                'autosaveMs' => (int) config('landing.autosave_interval_ms'),
                'fonts' => array_keys(Sanitizer::fontStacks()),
                'templateCategories' => LandingPageTemplate::CATEGORIES,
                'metaEvents' => config('landing.tracking.standard_events'),
                'metaApiVersion' => config('landing.tracking.meta_api_version'),
            ],
            // Non-secret facts about the global Meta setup, shown next to the per-page overrides.
            'globalMeta' => [
                'pixel_id' => LandingPageSetting::publicValue('meta.pixel_id') ?: config('landing.tracking.meta_default_pixel_id'),
                'capi_enabled' => LandingPageSetting::publicValue('meta.capi_enabled', '0') === '1',
            ],
        ]);
    }

    /** Document loaded inside the builder's canvas iframe (real frontend rendering of the draft). */
    public function canvas(LandingPage $landingPage, LandingPageRenderer $renderer, ContentNormalizer $normalizer)
    {
        Gate::authorize('update', $landingPage);
        $user = request()->user();
        $canScripts = LandingPermissions::allows($user, 'landing_pages.tracking') || in_array($user?->role, ['admin', 'manager'], true);

        $compiled = $renderer->compile(
            $normalizer->migrate($landingPage->content_json ?? []),
            $landingPage->settings_json ?? [],
            new RenderContext(editing: true, allowCustomCode: $canScripts),
        );

        return response()->view('landing.canvas', [
            'compiled' => $compiled,
            'fontsUrl' => LandingPageRenderer::fontsUrl($compiled['fonts']),
            'bodyClass' => trim((string) ($landingPage->settings_json['body_class'] ?? '')),
        ])->header('X-Robots-Tag', 'noindex, nofollow')->header('Cache-Control', 'no-store');
    }

    /** Render UNSAVED builder state for the canvas. Nothing is stored. */
    public function render(Request $request, LandingPage $landingPage, LandingPageRenderer $renderer, ContentNormalizer $normalizer): JsonResponse
    {
        Gate::authorize('update', $landingPage);
        $request->validate(['content' => ['required', 'array'], 'settings' => ['sometimes', 'array']]);
        $user = $request->user();
        $canScripts = LandingPermissions::allows($user, 'landing_pages.tracking') || in_array($user?->role, ['admin', 'manager'], true);

        try {
            $content = $normalizer->normalize($request->input('content'), $canScripts, $landingPage->content_json);
        } catch (InvalidBuilderContent $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $settings = PageMeta::settings($request->input('settings'), $landingPage->settings_json, $canScripts);
        $compiled = $renderer->compile($content, $settings, new RenderContext(editing: true, allowCustomCode: $canScripts));

        return response()->json([
            'html' => $compiled['body'],
            'css' => $compiled['css'],
            'fontsUrl' => LandingPageRenderer::fontsUrl($compiled['fonts']),
            'bodyClass' => $settings['body_class'],
        ]);
    }

    public function save(UpdateLandingPageRequest $request, LandingPage $landingPage): JsonResponse
    {
        return $this->persist($request, $landingPage, snapshot: true);
    }

    public function autosave(UpdateLandingPageRequest $request, LandingPage $landingPage): JsonResponse
    {
        return $this->persist($request, $landingPage, snapshot: false);
    }

    private function persist(UpdateLandingPageRequest $request, LandingPage $page, bool $snapshot): JsonResponse
    {
        try {
            $page = $this->pages->saveDraft($page, $request->validated(), $request->user(), $snapshot);
        } catch (InvalidBuilderContent $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => ['content' => [$e->getMessage()]]], 422);
        }

        return response()->json([
            'ok' => true,
            'saved_at' => now()->toIso8601String(),
            'page' => LandingPagePresenter::builder($page->refresh()),
        ]);
    }

    public function publish(PublishLandingPageRequest $request, LandingPage $landingPage): JsonResponse
    {
        $page = $this->pages->publish($landingPage, $request->user());

        return response()->json([
            'ok' => true,
            'message' => 'Published. Your page is live at '.$page->publicUrl(),
            'page' => LandingPagePresenter::builder($page->refresh()),
        ]);
    }

    public function unpublish(Request $request, LandingPage $landingPage): JsonResponse
    {
        Gate::authorize('publish', $landingPage);
        $page = $this->pages->unpublish($landingPage);

        return response()->json(['ok' => true, 'message' => 'Page unpublished.', 'page' => LandingPagePresenter::builder($page->refresh())]);
    }

    public function previewLink(LandingPage $landingPage): JsonResponse
    {
        Gate::authorize('view', $landingPage);

        return response()->json([
            'url' => URL::temporarySignedRoute('landing.preview', now()->addMinutes((int) config('landing.preview_ttl_minutes')), ['landingPage' => $landingPage->id]),
        ]);
    }

    public function duplicate(Request $request, LandingPage $landingPage)
    {
        Gate::authorize('update', $landingPage);
        Gate::authorize('create', LandingPage::class);

        $copy = $this->pages->duplicate($landingPage, $request->user(), $request->boolean('copy_tracking', true));

        return redirect()->route('admin.landing.builder', $copy)->with('success', 'Page duplicated.');
    }

    public function destroy(LandingPage $landingPage)
    {
        Gate::authorize('delete', $landingPage);
        $this->pages->delete($landingPage);

        return redirect()->route('admin.landing.index')->with('success', 'Landing page deleted.');
    }

    // ---- versions --------------------------------------------------------

    public function versions(LandingPage $landingPage): JsonResponse
    {
        Gate::authorize('view', $landingPage);

        return response()->json(['versions' => $this->versions->list($landingPage)]);
    }

    public function restoreVersion(Request $request, LandingPage $landingPage, LandingPageVersion $version): JsonResponse
    {
        Gate::authorize('update', $landingPage);
        abort_unless($version->landing_page_id === $landingPage->id, 404);

        $this->versions->restore($landingPage, $version, $request->user());
        $landingPage->refresh();

        return response()->json([
            'ok' => true,
            'message' => 'Draft restored from version '.$version->version_number.'. The published page is unchanged until you publish.',
            'content' => $landingPage->content_json,
            'settings' => array_replace(PageMeta::settingsDefaults(), $landingPage->settings_json ?? []),
            'seo' => array_replace(PageMeta::seoDefaults(), $landingPage->seo_json ?? []),
            'tracking' => LandingPagePresenter::tracking($landingPage, LandingPermissions::allows($request->user(), 'landing_pages.tracking')),
            'page' => LandingPagePresenter::builder($landingPage),
        ]);
    }

    public function destroyVersion(LandingPage $landingPage, LandingPageVersion $version): JsonResponse
    {
        Gate::authorize('update', $landingPage);

        try {
            $this->versions->delete($landingPage, $version);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['ok' => true, 'versions' => $this->versions->list($landingPage)]);
    }

    // ---- tracking (Meta Pixel / CAPI / scripts) --------------------------

    public function updateTracking(UpdateTrackingRequest $request, LandingPage $landingPage): JsonResponse
    {
        $page = $this->pages->updateTracking(
            $landingPage,
            $request->input('tracking'),
            $request->input('capi_access_token'),
            $request->boolean('clear_capi_token'),
            $request->user(),
        );

        return response()->json([
            'ok' => true,
            'message' => 'Tracking settings saved.',
            'tracking' => LandingPagePresenter::tracking($page->refresh(), true),
            'page' => LandingPagePresenter::builder($page),
        ]);
    }

    // ---- import / export -------------------------------------------------

    public function export(LandingPage $landingPage)
    {
        Gate::authorize('update', $landingPage);

        return response()->json($this->pages->export($landingPage), 200, [
            'Content-Disposition' => 'attachment; filename="'.$landingPage->slug.'.landing.json"',
        ]);
    }

    public function import(Request $request)
    {
        Gate::authorize('create', LandingPage::class);
        $request->validate(['file' => ['required', 'file', 'max:4096'], 'title' => ['nullable', 'string', 'max:200']]);

        $data = json_decode((string) file_get_contents($request->file('file')->getRealPath()), true);
        if (! is_array($data)) {
            return back()->withErrors(['file' => 'The file is not valid JSON.']);
        }

        $title = $request->input('title') ?: (string) ($data['title'] ?? 'Imported page');
        $slug = LandingSlug::unique((string) ($data['slug'] ?? $title));
        $page = $this->pages->import($data, $title, $slug, $request->user());

        return redirect()->route('admin.landing.builder', $page)->with('success', 'Page imported as a draft.');
    }
}
