<?php

namespace App\Services\Landing;

use App\Landing\Builder\ContentNormalizer;
use App\Landing\Builder\ContentTree;
use App\Landing\Builder\Elements\FormElement;
use App\Landing\Builder\Exceptions\InvalidBuilderContent;
use App\Models\LandingPage;
use App\Models\LandingPageTemplate;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class LandingPageService
{
    public function __construct(
        private ContentNormalizer $normalizer,
        private LandingPageVersionService $versions,
    ) {}

    public function create(array $data, User $user): LandingPage
    {
        return DB::transaction(function () use ($data, $user) {
            $content = ContentNormalizer::emptyContent();
            $settings = PageMeta::settingsDefaults();
            $seo = PageMeta::seoDefaults();
            $tracking = TrackingConfig::defaults();

            if (! empty($data['template_id'])) {
                $tpl = LandingPageTemplate::findOrFail($data['template_id']);
                $content = $this->normalizer->withFreshIds($this->normalizer->normalize($tpl->content_json, allowCustomCode: false));
                $settings = PageMeta::settings($tpl->settings_json, null, false);
                $seo = PageMeta::seo($tpl->seo_json);
            }

            $page = LandingPage::create([
                'created_by' => $user->id,
                'title' => $data['title'],
                'slug' => $data['slug'],
                'status' => LandingPage::STATUS_DRAFT,
                'content_json' => $content,
                'settings_json' => $settings,
                'seo_json' => $seo,
                'tracking_json' => $tracking,
            ]);

            $this->versions->snapshot($page, $user, empty($data['template_id']) ? 'Created' : 'Created from template');

            return $page;
        });
    }

    /**
     * Save the working draft. Published content is unaffected until publish().
     *
     * @param  array  $payload  optional keys: title, slug, content, settings, seo
     * @param  bool  $snapshot  create a version row (explicit save) or not (autosave)
     */
    public function saveDraft(LandingPage $page, array $payload, User $user, bool $snapshot): LandingPage
    {
        $canScripts = LandingPermissions::allows($user, 'landing_pages.tracking');

        return DB::transaction(function () use ($page, $payload, $user, $snapshot, $canScripts) {
            if (array_key_exists('content', $payload)) {
                $page->content_json = $this->normalizer->normalize($payload['content'], $canScripts, $page->content_json);
            }
            if (array_key_exists('settings', $payload)) {
                $page->settings_json = PageMeta::settings($payload['settings'], $page->settings_json, $canScripts);
            }
            if (array_key_exists('seo', $payload)) {
                $page->seo_json = PageMeta::seo($payload['seo']);
            }
            if (! empty($payload['title'])) {
                $page->title = mb_substr($payload['title'], 0, 200);
            }
            if (! empty($payload['slug']) && $payload['slug'] !== $page->slug) {
                $page->slug = $payload['slug'];
            }
            $page->save();

            if ($snapshot) {
                $this->versions->snapshot($page, $user, 'Saved');
            }

            return $page;
        });
    }

    public function updateTracking(LandingPage $page, array $tracking, ?string $token, bool $clearToken, User $user): LandingPage
    {
        $page->tracking_json = TrackingConfig::normalize($tracking, $page->tracking_json, allowScripts: true);
        if ($clearToken) {
            $page->capi_access_token = null;
        } elseif ($token !== null && $token !== '') {
            $page->capi_access_token = $token;
        }
        $page->save();

        return $page;
    }

    /**
     * Publish the current draft. Everything is validated first and runs in one transaction,
     * so a failure leaves the currently published version untouched.
     */
    public function publish(LandingPage $page, User $user): LandingPage
    {
        $errors = $this->validateForPublish($page);
        if ($errors) {
            throw ValidationException::withMessages(['publish' => $errors]);
        }

        try {
            return DB::transaction(function () use ($page, $user) {
                // Re-normalise so a snapshot can never contain unvalidated content.
                $page->content_json = $this->normalizer->normalize($page->content_json, true, $page->content_json);
                $page->save();

                $version = $this->versions->snapshot($page, $user, 'Published');

                $page->forceFill([
                    'status' => LandingPage::STATUS_PUBLISHED,
                    'published_version_id' => $version->id,
                    'published_at' => now(),
                ])->save();

                return $page;
            });
        } catch (\Throwable $e) {
            Log::error('Landing page publish failed', ['page_id' => $page->id, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function unpublish(LandingPage $page): LandingPage
    {
        $page->forceFill(['status' => LandingPage::STATUS_DRAFT, 'published_version_id' => null, 'published_at' => null])->save();

        return $page;
    }

    public function archive(LandingPage $page): LandingPage
    {
        $page->forceFill(['status' => LandingPage::STATUS_ARCHIVED, 'published_version_id' => null])->save();

        return $page;
    }

    /** @return list<string> human readable problems that block publishing */
    public function validateForPublish(LandingPage $page): array
    {
        $errors = [];

        if (trim((string) $page->title) === '') {
            $errors[] = 'The page needs a title.';
        }
        if (! preg_match(LandingSlug::PATTERN, (string) $page->slug) || LandingSlug::isReserved($page->slug)) {
            $errors[] = 'The slug is invalid or conflicts with an existing route.';
        }

        try {
            $content = $this->normalizer->normalize($page->content_json, true, $page->content_json);
        } catch (InvalidBuilderContent $e) {
            return array_merge($errors, [$e->getMessage()]);
        }

        if (empty($content['sections'])) {
            $errors[] = 'Add at least one section before publishing.';
        }
        foreach (ContentTree::ofType($content, ['form']) as $form) {
            if (! FormElement::definition($form)) {
                $errors[] = 'A lead form has no fields.';
                break;
            }
        }

        foreach (ContentTree::ofType($content, ['order_form']) as $form) {
            $ids = array_column(\App\Landing\Builder\Elements\OrderFormElement::config($form)['items'], 'id');
            if (! $ids || \App\Models\Product::whereIn('id', $ids)->count() === 0) {
                $errors[] = 'An order form has no valid products. Add at least one product to it.';
                break;
            }
        }

        return $errors;
    }

    public function duplicate(LandingPage $page, User $user, bool $copyTracking = true): LandingPage
    {
        return DB::transaction(function () use ($page, $user, $copyTracking) {
            $seo = $page->seo_json ?? PageMeta::seoDefaults();
            $seo['canonical'] = '';

            $copy = LandingPage::create([
                'created_by' => $user->id,
                'title' => mb_substr($page->title.' Copy', 0, 200),
                'slug' => LandingSlug::unique($page->slug.'-copy'),
                'status' => LandingPage::STATUS_DRAFT,
                'content_json' => $this->normalizer->withFreshIds($page->content_json ?? ContentNormalizer::emptyContent()),
                'settings_json' => $page->settings_json,
                'seo_json' => $seo,
                'tracking_json' => $copyTracking ? $page->tracking_json : TrackingConfig::defaults(),
            ]);
            // Leads, events and the (encrypted) access token are deliberately not copied.
            $this->versions->snapshot($copy, $user, 'Duplicated from "'.$page->title.'"');

            return $copy;
        });
    }

    public function delete(LandingPage $page): void
    {
        DB::transaction(function () use ($page) {
            // Free the slug for reuse and make sure it can no longer resolve publicly.
            $page->forceFill([
                'slug' => $page->slug.'--deleted-'.$page->id,
                'status' => LandingPage::STATUS_ARCHIVED,
                'published_version_id' => null,
            ])->save();
            $page->delete();
        });
    }

    /** JSON export (no tracking secrets, no analytics). */
    public function export(LandingPage $page): array
    {
        return [
            'format' => 'landing-page',
            'builder_version' => (int) config('landing.builder_version'),
            'title' => $page->title,
            'slug' => $page->slug,
            'content' => $page->content_json,
            'settings' => $page->settings_json,
            'seo' => $page->seo_json,
            'exported_at' => now()->toIso8601String(),
        ];
    }

    /** Import validates and sanitises everything; raw scripts are never imported. */
    public function import(array $data, string $title, string $slug, User $user): LandingPage
    {
        if (($data['format'] ?? null) !== 'landing-page' || ! is_array($data['content'] ?? null)) {
            throw ValidationException::withMessages(['file' => 'This is not a valid landing page export.']);
        }

        try {
            $content = $this->normalizer->withFreshIds($this->normalizer->normalize($data['content'], allowCustomCode: false));
        } catch (InvalidBuilderContent $e) {
            throw ValidationException::withMessages(['file' => $e->getMessage()]);
        }

        return DB::transaction(function () use ($data, $content, $title, $slug, $user) {
            $page = LandingPage::create([
                'created_by' => $user->id,
                'title' => $title,
                'slug' => $slug,
                'status' => LandingPage::STATUS_DRAFT,
                'content_json' => $content,
                'settings_json' => PageMeta::settings($data['settings'] ?? null, null, false),
                'seo_json' => PageMeta::seo($data['seo'] ?? null),
                'tracking_json' => TrackingConfig::defaults(),
            ]);
            $this->versions->snapshot($page, $user, 'Imported');

            return $page;
        });
    }
}
