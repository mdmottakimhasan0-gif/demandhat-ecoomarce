<?php

namespace App\Services\Landing;

use Illuminate\Support\Facades\Cache;

/**
 * Cache of compiled PUBLISHED pages only. Drafts and previews are never cached.
 * A generation counter lets us invalidate everything (e.g. global settings change)
 * without needing cache tags, which the file driver does not support.
 */
class LandingPageCache
{
    private const GEN_KEY = 'landing:cache:generation';

    public static function enabled(): bool
    {
        return (bool) config('landing.cache.enabled');
    }

    private static function generation(): int
    {
        return (int) Cache::get(self::GEN_KEY, 1);
    }

    private static function key(string $slug): string
    {
        return 'landing:page:'.self::generation().':'.$slug;
    }

    public static function remember(string $slug, \Closure $callback): mixed
    {
        if (! self::enabled()) {
            return $callback();
        }

        return Cache::remember(self::key($slug), (int) config('landing.cache.ttl'), $callback);
    }

    public static function forget(string $slug): void
    {
        Cache::forget(self::key($slug));
    }

    public static function flushAll(): void
    {
        Cache::forever(self::GEN_KEY, self::generation() + 1);
    }
}
