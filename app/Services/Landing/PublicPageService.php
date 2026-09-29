<?php

namespace App\Services\Landing;

use App\Landing\Builder\ContentNormalizer;
use App\Landing\Builder\LandingPageRenderer;
use App\Landing\Builder\RenderContext;
use App\Models\LandingPage;
use App\Models\LandingPageTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Js;

/**
 * Builds everything the public/preview view needs. Only PUBLISHED snapshots are
 * cached; drafts, previews and template previews are always rendered fresh.
 */
class PublicPageService
{
    public function __construct(
        private LandingPageRenderer $renderer,
        private ContentNormalizer $normalizer,
        private MetaPixelService $pixels,
    ) {}

    /** Compiled published page, or null when the slug is not (or no longer) published. */
    public function resolvePublished(string $slug): ?array
    {
        return LandingPageCache::remember($slug, function () use ($slug) {
            $page = LandingPage::published()->where('slug', $slug)->with('publishedVersion')->first();
            $version = $page?->publishedVersion;
            if (! $version) {
                return null;
            }

            return $this->compile(
                pageId: $page->id, slug: $page->slug, title: $page->title,
                content: $this->normalizer->migrate($version->content_json ?? []),
                settings: $version->settings_json ?? [], seo: $version->seo_json ?? [], tracking: $version->tracking_json ?? [],
                deferVars: true,
            ) + ['published_at' => $page->published_at?->toIso8601String()];
        });
    }

    /** Draft render for the protected preview link (never cached, never indexable). */
    public function resolveDraft(LandingPage $page): array
    {
        return $this->compile(
            pageId: $page->id, slug: $page->slug, title: $page->title,
            content: $this->normalizer->migrate($page->content_json ?? []),
            settings: $page->settings_json ?? [], seo: $page->seo_json ?? [], tracking: $page->tracking_json ?? [],
            deferVars: false, preview: true,
        );
    }

    public function resolveTemplate(LandingPageTemplate $template): array
    {
        return $this->compile(
            pageId: 0, slug: 'template-'.$template->id, title: $template->name,
            content: $this->normalizer->migrate($template->content_json ?? []),
            settings: $template->settings_json ?? [], seo: $template->seo_json ?? [], tracking: [],
            deferVars: false, preview: true,
        );
    }

    private function compile(int $pageId, string $slug, string $title, array $content, array $settings, array $seo, array $tracking, bool $deferVars, bool $preview = false): array
    {
        $ctx = new RenderContext(editing: false, vars: ['page_title' => $title], allowCustomCode: true, deferVars: $deferVars);
        $compiled = $this->renderer->compile($content, $settings, $ctx);

        return [
            'page_id' => $pageId,
            'slug' => $slug,
            'title' => $title,
            'compiled' => $compiled,
            'settings' => array_replace(PageMeta::settingsDefaults(), $settings),
            'seo' => array_replace(PageMeta::seoDefaults(), $seo),
            'tracking' => array_replace_recursive(TrackingConfig::defaults(), $tracking),
            'preview' => $preview,
        ];
    }

    /**
     * Per-request view data. $eventId is the page-load id shared by browser Pixel and CAPI.
     */
    public function viewData(array $p, Request $request, ?string $eventId, bool $indexable = true): array
    {
        $c = $p['compiled'];
        $settings = $p['settings'];
        $tracking = $p['tracking'];
        $meta = $this->pixels->resolve($tracking);
        $utm = $request->hasSession() ? (app(AttributionService::class)->get($request)['utm'] ?? []) : [];

        $body = $this->fillVars($c['body'], $utm);
        $seo = $this->seoTags($p, $indexable);

        $customJs = trim((string) $settings['custom_js']);
        $scripts = [
            'head' => (string) $tracking['scripts']['head'],
            'body_start' => (string) $tracking['scripts']['body_start'],
            'body_end' => (string) $tracking['scripts']['body_end'].($customJs !== '' ? "\n<script>\n".$customJs."\n</script>" : ''),
        ];

        $runtime = [
            'slug' => $p['slug'],
            'eventId' => $eventId,
            'pixel' => $meta->toPublic(), // never includes CAPI settings or the token
            'submitUrl' => $p['preview'] ? null : route('landing.submit', ['slug' => $p['slug']], false),
            'trackUrl' => $p['preview'] ? null : route('landing.track', ['slug' => $p['slug']], false),
            'consent' => (bool) config('landing.tracking.require_consent'),
            'preview' => $p['preview'],
        ];

        return [
            'seo' => $seo,
            'lang' => $settings['lang'],
            'favicon' => $settings['favicon'],
            'css' => $c['css'],
            'fontsUrl' => LandingPageRenderer::fontsUrl($c['fonts']),
            'body' => $body,
            'bodyClass' => trim($settings['body_class']),
            'layout' => $settings['layout'],
            'headerHtml' => $settings['layout'] === 'custom' ? $settings['header_html'] : '',
            'footerHtml' => $settings['layout'] === 'custom' ? $settings['footer_html'] : '',
            'scripts' => $scripts,
            'flags' => $c['flags'],
            'runtimeJs' => (string) Js::from($runtime),
            'runtime' => $runtime,
        ];
    }

    /** Replace deferred [[lp:utm_x]] tokens with escaped per-visitor values. */
    public function fillVars(string $html, array $utm): string
    {
        if (! str_contains($html, '[[lp:')) {
            return $html;
        }

        return preg_replace_callback('/\[\[lp:(utm_[a-z]+)\]\]/', fn ($m) => e((string) ($utm[$m[1]] ?? '')), $html);
    }

    /** One associative set keyed by name/property so no tag can be emitted twice. */
    private function seoTags(array $p, bool $indexable): array
    {
        $seo = $p['seo'];
        $title = $seo['title'] ?: $p['title'];
        $desc = $seo['description'];
        $url = url('/'.$p['slug']);
        $robots = $indexable && ! $p['preview'] ? $seo['robots'] : 'noindex,nofollow';

        $tags = [];
        $add = function (string $attr, string $key, ?string $content) use (&$tags) {
            if ($content !== null && $content !== '') {
                $tags[$attr.':'.$key] = ['attr' => $attr, 'key' => $key, 'content' => $content];
            }
        };

        $add('name', 'description', $desc);
        $add('name', 'robots', $robots);
        $add('property', 'og:type', 'website');
        $add('property', 'og:title', $seo['og_title'] ?: $title);
        $add('property', 'og:description', $seo['og_description'] ?: $desc);
        $add('property', 'og:url', $seo['canonical'] ?: $url);
        $add('property', 'og:image', $seo['og_image']);
        $add('property', 'og:site_name', config('app.name'));
        $twImage = $seo['twitter_image'] ?: $seo['og_image'];
        $add('name', 'twitter:card', $twImage ? 'summary_large_image' : 'summary');
        $add('name', 'twitter:title', $seo['twitter_title'] ?: $seo['og_title'] ?: $title);
        $add('name', 'twitter:description', $seo['twitter_description'] ?: $seo['og_description'] ?: $desc);
        $add('name', 'twitter:image', $twImage);

        return [
            'title' => $title,
            'canonical' => $p['preview'] ? null : ($seo['canonical'] ?: $url),
            'robots' => $robots,
            'meta' => array_values($tags),
        ];
    }
}
