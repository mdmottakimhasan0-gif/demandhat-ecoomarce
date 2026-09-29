<?php

namespace App\Services\Landing;

use App\Landing\Builder\ContentNormalizer;
use App\Landing\Builder\Exceptions\InvalidBuilderContent;
use App\Models\LandingPage;
use App\Models\LandingPageTemplate;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class LandingPageTemplateService
{
    public function __construct(private ContentNormalizer $normalizer) {}

    /** Save a page's current draft as a reusable template. Raw custom code and tracking are not copied. */
    public function createFromPage(LandingPage $page, array $data, User $user): LandingPageTemplate
    {
        return LandingPageTemplate::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'] ?? 'Custom',
            'thumbnail' => $data['thumbnail'] ?? null,
            'is_public' => (bool) ($data['is_public'] ?? true),
            'created_by' => $user->id,
            'content_json' => $this->normalizer->normalize($this->contentFor($page, $data['element'] ?? null), allowCustomCode: false),
            'settings_json' => PageMeta::settings($page->settings_json, null, false),
            'seo_json' => PageMeta::seo($page->seo_json),
        ]);
    }

    /** Whole page, or just one element wrapped so it is a valid document (section > container > element). */
    private function contentFor(LandingPage $page, ?array $element): array
    {
        if (! $element) {
            return $page->content_json ?? ContentNormalizer::emptyContent();
        }
        $node = $this->normalizer->withFreshIds(['sections' => [$element]])['sections'][0];
        if (($node['type'] ?? '') !== 'section') {
            $node = [
                'id' => ContentNormalizer::newId('section'), 'type' => 'section', 'content' => ['content_width' => 'boxed'], 'settings' => [],
                'children' => [['id' => ContentNormalizer::newId('container'), 'type' => 'container', 'content' => [], 'settings' => [], 'children' => [$node]]],
            ];
        }

        return ['version' => (int) config('landing.builder_version'), 'sections' => [$node]];
    }

    /**
     * Save the visual builder's draft state onto this template (design edits, not metadata).
     * Custom code is never allowed here - a template can be used by anyone with library access.
     */
    public function saveDraft(LandingPageTemplate $template, array $payload): LandingPageTemplate
    {
        if (array_key_exists('content', $payload)) {
            $template->content_json = $this->normalizer->normalize($payload['content'], allowCustomCode: false, previous: $template->content_json);
        }
        if (array_key_exists('settings', $payload)) {
            $template->settings_json = PageMeta::settings($payload['settings'], $template->settings_json, false);
        }
        if (array_key_exists('seo', $payload)) {
            $template->seo_json = PageMeta::seo($payload['seo']);
        }
        if (! empty($payload['title'])) {
            $template->name = mb_substr($payload['title'], 0, 250);
        }
        $template->save();

        return $template;
    }

    /** Shape handed to the builder UI (mirrors LandingPagePresenter::builder() for a LandingPage). */
    public static function present(LandingPageTemplate $template): array
    {
        return [
            'id' => $template->id,
            'title' => $template->name,
            'slug' => null,
            'status' => 'template',
            'url' => null,
            'published_at' => null,
            'updated_at' => $template->updated_at?->toIso8601String(),
            'is_live' => false,
            'has_unpublished_changes' => false,
            'builder_url' => route('admin.landing.templates.edit', $template),
        ];
    }

    public function duplicate(LandingPageTemplate $template, User $user): LandingPageTemplate
    {
        $copy = $template->replicate();
        $copy->name = mb_substr($template->name.' Copy', 0, 250);
        $copy->created_by = $user->id;
        $copy->content_json = $this->normalizer->withFreshIds($template->content_json ?? ContentNormalizer::emptyContent());
        $copy->save();

        return $copy;
    }

    /** Portable JSON: move a template built on one server (e.g. local) to another (e.g. live) via a file. */
    public function export(LandingPageTemplate $template): array
    {
        return [
            'format' => 'landing-template',
            'builder_version' => (int) config('landing.builder_version'),
            'name' => $template->name,
            'description' => $template->description,
            'category' => $template->category,
            'content' => $template->content_json,
            'settings' => $template->settings_json,
            'seo' => $template->seo_json,
            'exported_at' => now()->toIso8601String(),
        ];
    }

    /** Import validates and sanitises everything; raw custom code is never imported. */
    public function import(array $data, User $user): LandingPageTemplate
    {
        if (($data['format'] ?? null) !== 'landing-template' || ! is_array($data['content'] ?? null) || ! trim((string) ($data['name'] ?? ''))) {
            throw ValidationException::withMessages(['file' => 'This is not a valid landing template export.']);
        }

        try {
            $content = $this->normalizer->withFreshIds($this->normalizer->normalize($data['content'], allowCustomCode: false));
        } catch (InvalidBuilderContent $e) {
            throw ValidationException::withMessages(['file' => $e->getMessage()]);
        }

        return LandingPageTemplate::create([
            'name' => $this->uniqueName(mb_substr((string) $data['name'], 0, 240)),
            'description' => $data['description'] ?? null,
            'category' => in_array($data['category'] ?? null, LandingPageTemplate::CATEGORIES, true) ? $data['category'] : 'Custom',
            'is_public' => true,
            'created_by' => $user->id,
            'content_json' => $content,
            'settings_json' => PageMeta::settings($data['settings'] ?? null, null, false),
            'seo_json' => PageMeta::seo($data['seo'] ?? null),
        ]);
    }

    /** Templates share no unique-name constraint in the DB, but keep the library tidy on repeated imports. */
    private function uniqueName(string $name): string
    {
        $base = $name;
        $n = 1;
        while (LandingPageTemplate::where('name', $name)->exists()) {
            $n++;
            $name = mb_substr($base, 0, 235).' ('.$n.')';
        }

        return $name;
    }
}
