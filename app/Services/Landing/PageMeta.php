<?php

namespace App\Services\Landing;

use App\Landing\Support\Sanitizer;

/** Normalisers for the page settings (settings_json) and SEO (seo_json) blobs. */
class PageMeta
{
    public const ROBOTS = ['index,follow', 'noindex,follow', 'index,nofollow', 'noindex,nofollow'];

    public static function settingsDefaults(): array
    {
        return [
            'layout' => 'blank', // blank | website | custom
            'full_width' => false,
            'container_width' => 0,
            'product_id' => null,
            'body_class' => '',
            'background_color' => '',
            'text_color' => '',
            'font_family' => '',
            'custom_css' => '',
            'custom_js' => '',
            'favicon' => '',
            'header_html' => '',
            'footer_html' => '',
            'lang' => 'en',
        ];
    }

    public static function settings(?array $in, ?array $previous = null, bool $allowScripts = true): array
    {
        $d = self::settingsDefaults();
        $in = array_replace($previous ?? $d, $in ?? []);

        $font = (string) ($in['font_family'] ?? '');

        return [
            'layout' => Sanitizer::enum($in['layout'] ?? 'blank', ['blank', 'website', 'custom']) ?? 'blank',
            'full_width' => (bool) ($in['full_width'] ?? false),
            'container_width' => max(0, min(2400, (int) ($in['container_width'] ?? 0))),
            'product_id' => ! empty($in['product_id']) ? (int) $in['product_id'] : null,
            'body_class' => Sanitizer::token($in['body_class'] ?? '', true),
            'background_color' => Sanitizer::color($in['background_color'] ?? '') ?? '',
            'text_color' => Sanitizer::color($in['text_color'] ?? '') ?? '',
            'font_family' => Sanitizer::fontFamily($font) ? $font : '',
            'custom_css' => Sanitizer::css($in['custom_css'] ?? '', 'body.lp-body') === '' ? '' : mb_substr((string) $in['custom_css'], 0, 20000),
            'custom_js' => $allowScripts ? mb_substr((string) ($in['custom_js'] ?? ''), 0, 50000) : (string) (($previous ?? $d)['custom_js'] ?? ''),
            'favicon' => Sanitizer::url($in['favicon'] ?? '', ['http', 'https']),
            'header_html' => Sanitizer::html((string) ($in['header_html'] ?? ''), 'html'),
            'footer_html' => Sanitizer::html((string) ($in['footer_html'] ?? ''), 'html'),
            'lang' => preg_match('/^[a-z]{2}(-[A-Za-z]{2})?$/', (string) ($in['lang'] ?? 'en')) ? $in['lang'] : 'en',
        ];
    }

    public static function seoDefaults(): array
    {
        return [
            'title' => '', 'description' => '', 'canonical' => '', 'robots' => 'index,follow',
            'og_title' => '', 'og_description' => '', 'og_image' => '',
            'twitter_title' => '', 'twitter_description' => '', 'twitter_image' => '',
        ];
    }

    public static function seo(?array $in): array
    {
        $in = array_replace(self::seoDefaults(), $in ?? []);
        $t = fn ($k, $max) => mb_substr(trim(strip_tags((string) $in[$k])), 0, $max);

        return [
            'title' => $t('title', 160),
            'description' => $t('description', 320),
            'canonical' => Sanitizer::url($in['canonical'], ['http', 'https'], false),
            'robots' => in_array($in['robots'], self::ROBOTS, true) ? $in['robots'] : 'index,follow',
            'og_title' => $t('og_title', 160),
            'og_description' => $t('og_description', 320),
            'og_image' => Sanitizer::url($in['og_image'], ['http', 'https']),
            'twitter_title' => $t('twitter_title', 160),
            'twitter_description' => $t('twitter_description', 320),
            'twitter_image' => Sanitizer::url($in['twitter_image'], ['http', 'https']),
        ];
    }
}
