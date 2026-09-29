<?php

namespace App\Services\Landing;

use App\Models\LandingPage;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

/**
 * Slug rules. A slug becomes a root level URL (/{slug}), so it must never collide with
 * a route or public file that the application already owns.
 */
class LandingSlug
{
    public const PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    public static function normalize(string $input): string
    {
        return Str::limit(Str::slug($input), 80, '');
    }

    public static function isReserved(string $slug): bool
    {
        $slug = strtolower($slug);
        if (in_array($slug, array_map('strtolower', config('landing.reserved_slugs')), true)) {
            return true;
        }
        if (in_array($slug, self::routeSegments(), true)) {
            return true;
        }

        // Real files/directories inside /public are served by the web server before Laravel.
        return file_exists(public_path($slug));
    }

    /** First static URI segment of every registered route. */
    private static function routeSegments(): array
    {
        $segments = [];
        foreach (Route::getRoutes()->getRoutes() as $route) {
            $first = explode('/', trim($route->uri(), '/'))[0] ?? '';
            if ($first !== '' && ! str_starts_with($first, '{')) {
                $segments[$first] = true;
            }
        }

        return array_map('strtolower', array_keys($segments));
    }

    /** Next free slug based on $base ("offer", "offer-copy", "offer-copy-2" ...). */
    public static function unique(string $base, ?int $ignoreId = null): string
    {
        $base = self::normalize($base) ?: 'landing-page';
        $slug = $base;
        $i = 2;
        while (self::taken($slug, $ignoreId) || self::isReserved($slug)) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    public static function taken(string $slug, ?int $ignoreId = null): bool
    {
        return LandingPage::withTrashed()->where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists();
    }
}
