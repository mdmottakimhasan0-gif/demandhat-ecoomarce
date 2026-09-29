<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/** Simple website settings key/value store (cached). */
class SiteSetting extends Model
{
    protected $fillable = ['key', 'value'];

    private const CACHE_KEY = 'site_settings.all';

    public static function all_values(): array
    {
        return Cache::remember(self::CACHE_KEY, 600, fn () => static::query()->pluck('value', 'key')->all());
    }

    public static function read(string $key, mixed $default = null): mixed
    {
        $v = static::all_values()[$key] ?? null;

        return $v === null ? $default : $v;
    }

    public static function write(string $key, mixed $value): void
    {
        static::query()->updateOrCreate(['key' => $key], ['value' => is_bool($value) ? ($value ? '1' : '0') : (string) $value]);
        Cache::forget(self::CACHE_KEY);
    }
}
