<?php

namespace App\Http\Controllers\Landing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Landing\StoreTemplateRequest;
use App\Landing\Builder\ContentNormalizer;
use App\Landing\Builder\ElementRegistry;
use App\Landing\Builder\Exceptions\InvalidBuilderContent;
use App\Landing\Builder\LandingPageRenderer;
use App\Landing\Builder\RenderContext;
use App\Landing\Support\Sanitizer;
use App\Models\LandingPage;
use App\Models\LandingPageTemplate;
use App\Rules\AvailableLandingSlug;
use App\Services\Landing\LandingPageService;
use App\Services\Landing\LandingPageTemplateService;
use App\Services\Landing\LandingPermissions;
use App\Services\Landing\LandingSlug;
use App\Services\Landing\PageMeta;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\URL;
use Inertia\Inertia;

class LandingTemplateController extends Controller
{
    public function __construct(private LandingPageTemplateService $templates) {}

    public function index(Request $request)
    {
        Gate::authorize('viewAny', LandingPageTemplate::class);

        $items = LandingPageTemplate::query()
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->string('category')))
            ->orderBy('category')->orderBy('name')->get()
            ->map(fn (LandingPageTemplate $t) => [
                'id' => $t->id, 'name' => $t->name, 'description' => $t->description, 'category' => $t->category,
                'thumbnail' => $t->thumbnail, 'is_public' => $t->is_public, 'updated_at' => $t->updated_at?->toIso8601String(),
                'preview_url' => URL::temporarySignedRoute('landing.template-preview', now()->addMinutes((int) config('landing.preview_ttl_minutes')), ['template' => $t->id]),
            ]);

        return Inertia::render('Admin/LandingPages/Templates', [
            'templates' => $items,
            'categories' => LandingPageTemplate::CATEGORIES,
            'filters' => $request->only('category'),
        ]);
    }

    /** Save a landing page as a template (from the builder or the pages list). */
    public function store(StoreTemplateRequest $request)
    {
        $page = LandingPage::findOrFail($request->integer('landing_page_id'));
        Gate::authorize('view', $page);

        $template = $this->templates->createFromPage($page, $request->validated(), $request->user());

        if ($request->expectsJson()) {
            return response()->json(['ok' => true, 'message' => 'Saved as template "'.$template->name.'".', 'id' => $template->id]);
        }

        return redirect()->route('admin.landing.templates.index')->with('success', 'Template saved.');
    }

    public function update(StoreTemplateRequest $request, LandingPageTemplate $template)
    {
        Gate::authorize('update', $template);
        $template->update($request->safe()->only(['name', 'description', 'category', 'thumbnail', 'is_public']));

        return back()->with('success', 'Template updated.');
    }

    /** Open a template's actual design (sections/elements) in the same visual builder pages use. */
    public function edit(LandingPageTemplate $template, ElementRegistry $registry, Request $request)
    {
        Gate::authorize('update', $template);
        $user = $request->user();

        return Inertia::render('Admin/LandingPages/Builder', [
            'page' => LandingPageTemplateService::present($template),
            'content' => $template->content_json ?? ContentNormalizer::emptyContent(),
            'settings' => array_replace(PageMeta::settingsDefaults(), $template->settings_json ?? []),
            'seo' => array_replace(PageMeta::seoDefaults(), $template->seo_json ?? []),
            'tracking' => null,
            'schema' => $registry->schema(),
            // A template has no publish/unpublish/tracking/versions/"save as template" of its own.
            'can' => array_values(array_diff(LandingPermissions::for($user), ['landing_pages.publish', 'landing_pages.tracking', 'landing_pages.templates'])),
            'urls' => [
                'back' => route('admin.landing.templates.index'),
                'canvas' => route('admin.landing.templates.canvas', $template),
                'render' => route('admin.landing.templates.render', $template),
                'save' => route('admin.landing.templates.save', $template),
                'autosave' => route('admin.landing.templates.autosave', $template),
                'previewLink' => route('admin.landing.templates.preview-link', $template),
                'mediaList' => route('admin.landing.media.list'),
                'mediaUpload' => route('admin.landing.media.store'),
                'productSearch' => route('admin.landing.products.search'),
                'export' => route('admin.landing.templates.export', $template),
            ],
            'config' => [
                'autosaveMs' => (int) config('landing.autosave_interval_ms'),
                'fonts' => array_keys(Sanitizer::fontStacks()),
                'templateCategories' => LandingPageTemplate::CATEGORIES,
                'metaEvents' => config('landing.tracking.standard_events'),
                'metaApiVersion' => config('landing.tracking.meta_api_version'),
            ],
            'globalMeta' => ['pixel_id' => null, 'capi_enabled' => false],
        ]);
    }

    /** Document loaded inside the builder's canvas iframe - same renderer the public site uses. */
    public function canvas(LandingPageTemplate $template, LandingPageRenderer $renderer, ContentNormalizer $normalizer)
    {
        Gate::authorize('update', $template);
        $user = request()->user();
        $canScripts = LandingPermissions::allows($user, 'landing_pages.tracking') || in_array($user?->role, ['admin', 'manager'], true);

        $compiled = $renderer->compile(
            $normalizer->normalize($template->content_json ?? ContentNormalizer::emptyContent(), allowCustomCode: $canScripts),
            $template->settings_json ?? [],
            new RenderContext(editing: true, allowCustomCode: $canScripts),
        );

        return response()->view('landing.canvas', [
            'compiled' => $compiled,
            'fontsUrl' => LandingPageRenderer::fontsUrl($compiled['fonts']),
            'bodyClass' => trim((string) ($template->settings_json['body_class'] ?? '')),
        ])->header('X-Robots-Tag', 'noindex, nofollow')->header('Cache-Control', 'no-store');
    }

    /** Render UNSAVED builder state for the canvas. Nothing is stored. */
    public function render(Request $request, LandingPageTemplate $template, LandingPageRenderer $renderer, ContentNormalizer $normalizer): JsonResponse
    {
        Gate::authorize('update', $template);
        $request->validate(['content' => ['required', 'array'], 'settings' => ['sometimes', 'array']]);
        $user = $request->user();
        $canScripts = LandingPermissions::allows($user, 'landing_pages.tracking') || in_array($user?->role, ['admin', 'manager'], true);

        try {
            $content = $normalizer->normalize($request->input('content'), allowCustomCode: $canScripts, previous: $template->content_json);
        } catch (InvalidBuilderContent $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $settings = PageMeta::settings($request->input('settings'), $template->settings_json, $canScripts);
        $compiled = $renderer->compile($content, $settings, new RenderContext(editing: true, allowCustomCode: $canScripts));

        return response()->json([
            'html' => $compiled['body'],
            'css' => $compiled['css'],
            'fontsUrl' => LandingPageRenderer::fontsUrl($compiled['fonts']),
            'bodyClass' => $settings['body_class'],
        ]);
    }

    public function save(Request $request, LandingPageTemplate $template): JsonResponse
    {
        return $this->persistDraft($request, $template);
    }

    public function autosave(Request $request, LandingPageTemplate $template): JsonResponse
    {
        return $this->persistDraft($request, $template);
    }

    private function persistDraft(Request $request, LandingPageTemplate $template): JsonResponse
    {
        Gate::authorize('update', $template);
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:200'],
            'content' => ['sometimes', 'array'],
            'settings' => ['sometimes', 'array'],
            'seo' => ['sometimes', 'array'],
        ]);

        try {
            $template = $this->templates->saveDraft($template, $data);
        } catch (InvalidBuilderContent $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => ['content' => [$e->getMessage()]]], 422);
        }

        return response()->json(['ok' => true, 'saved_at' => now()->toIso8601String(), 'page' => LandingPageTemplateService::present($template->refresh())]);
    }

    /** A fresh, short-lived signed link to preview this template's current (saved) draft. */
    public function previewLink(LandingPageTemplate $template): JsonResponse
    {
        Gate::authorize('update', $template);

        return response()->json([
            'url' => URL::temporarySignedRoute('landing.template-preview', now()->addMinutes((int) config('landing.preview_ttl_minutes')), ['template' => $template->id]),
        ]);
    }

    public function duplicate(Request $request, LandingPageTemplate $template)
    {
        Gate::authorize('create', LandingPageTemplate::class);
        $this->templates->duplicate($template, $request->user());

        return back()->with('success', 'Template duplicated.');
    }

    public function destroy(LandingPageTemplate $template)
    {
        Gate::authorize('delete', $template);
        $template->delete();

        return back()->with('success', 'Template deleted.');
    }

    /** Download a template as a portable JSON file (build on one server, move it to another). */
    public function export(LandingPageTemplate $template)
    {
        Gate::authorize('view', $template);

        $filename = LandingSlug::normalize($template->name) ?: 'template';

        return response()->json($this->templates->export($template), 200, [
            'Content-Disposition' => 'attachment; filename="'.$filename.'.landing-template.json"',
        ]);
    }

    public function import(Request $request)
    {
        Gate::authorize('create', LandingPageTemplate::class);
        $request->validate(['file' => ['required', 'file', 'max:4096']]);

        $data = json_decode((string) file_get_contents($request->file('file')->getRealPath()), true);
        if (! is_array($data)) {
            return back()->withErrors(['file' => 'The file is not valid JSON.']);
        }

        $template = $this->templates->import($data, $request->user());

        return redirect()->route('admin.landing.templates.index')->with('success', 'Template "'.$template->name.'" imported.');
    }

    /** Create a landing page from a template. */
    public function use(Request $request, LandingPageTemplate $template, LandingPageService $pages)
    {
        Gate::authorize('create', LandingPage::class);

        $slug = LandingSlug::normalize((string) $request->input('slug', $request->input('title', '')));
        $data = $request->merge(['slug' => $slug])->validate([
            'title' => ['required', 'string', 'max:200'],
            'slug' => ['required', 'string', 'max:80', new AvailableLandingSlug],
        ]);

        $page = $pages->create($data + ['template_id' => $template->id], $request->user());

        return redirect()->route('admin.landing.builder', $page)->with('success', 'Page created from template.');
    }
}
