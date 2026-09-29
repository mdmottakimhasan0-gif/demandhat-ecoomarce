<?php

namespace App\Models;

use App\Services\Landing\LandingPageCache;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LandingPage extends Model
{
    use SoftDeletes;

    public const STATUS_DRAFT = 'draft';
    public const STATUS_PUBLISHED = 'published';
    public const STATUS_ARCHIVED = 'archived';

    protected $table = 'landing_pages';

    protected $fillable = [
        'created_by', 'title', 'slug', 'status', 'content_json', 'settings_json',
        'seo_json', 'tracking_json', 'published_version_id', 'published_at',
    ];

    /** The encrypted CAPI token is never mass-assignable or serialised. */
    protected $hidden = ['capi_access_token'];

    protected function casts(): array
    {
        return [
            'content_json' => 'array',
            'settings_json' => 'array',
            'seo_json' => 'array',
            'tracking_json' => 'array',
            'capi_access_token' => 'encrypted',
            'published_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        $flush = function (LandingPage $page) {
            LandingPageCache::forget($page->slug);
            if ($page->isDirty('slug') && $page->getOriginal('slug')) {
                LandingPageCache::forget($page->getOriginal('slug'));
            }
        };

        static::saved($flush);
        static::deleted($flush);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(LandingPageVersion::class)->orderByDesc('version_number');
    }

    public function publishedVersion(): BelongsTo
    {
        return $this->belongsTo(LandingPageVersion::class, 'published_version_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(LandingPageLead::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(LandingPageEvent::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED)->whereNotNull('published_version_id');
    }

    public function isPublished(): bool
    {
        return $this->status === self::STATUS_PUBLISHED && $this->published_version_id !== null;
    }

    public function publicUrl(): string
    {
        return url('/'.$this->slug);
    }

    public function hasCapiToken(): bool
    {
        return ! empty($this->capi_access_token);
    }
}
