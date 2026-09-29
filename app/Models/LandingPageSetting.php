<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

/**
 * Global key/value settings for the landing page module. Secrets (is_encrypted)
 * are encrypted with Laravel's encrypter and are never returned by all().
 */
class LandingPageSetting extends Model
{
    protected $table = 'landing_page_settings';

    protected $fillable = ['key', 'value', 'is_encrypted'];

    protected function casts(): array
    {
        return ['is_encrypted' => 'boolean'];
    }

    private const CACHE_KEY = 'landing:settings';

    /** Non-secret settings as key => value. */
    public static function all_public(): array
    {
        return Cache::remember(self::CACHE_KEY, 300, function () {
            return static::query()->where('is_encrypted', false)->pluck('value', 'key')->all();
        });
    }

    /** Cached read of a NON-secret setting. */
    public static function publicValue(string $key, mixed $default = null): mixed
    {
        $v = static::all_public()[$key] ?? null;

        return ($v === null || $v === '') ? $default : $v;
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        $row = static::query()->where('key', $key)->first();
        if (! $row || $row->value === null || $row->value === '') {
            return $default;
        }
        if ($row->is_encrypted) {
            try {
                return Crypt::decryptString($row->value);
            } catch (DecryptException) {
                return $default;
            }
        }

        return $row->value;
    }

    public static function put(string $key, mixed $value, bool $encrypted = false): void
    {
        $stored = ($value === null || $value === '') ? null : (string) $value;
        if ($stored !== null && $encrypted) {
            $stored = Crypt::encryptString($stored);
        }
        static::query()->updateOrCreate(['key' => $key], ['value' => $stored, 'is_encrypted' => $encrypted]);
        Cache::forget(self::CACHE_KEY);
        \App\Services\Landing\LandingPageCache::flushAll();
    }

    public static function has(string $key): bool
    {
        return static::query()->where('key', $key)->whereNotNull('value')->where('value', '!=', '')->exists();
    }
}
