<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingPageTemplate extends Model
{
    public const CATEGORIES = [
        'Lead Generation', 'Product', 'Service', 'Agency', 'Webinar',
        'Consultation', 'E-commerce', 'Promotion', 'Coming Soon', 'Custom',
    ];

    protected $table = 'landing_page_templates';

    protected $fillable = [
        'name', 'description', 'thumbnail', 'category', 'content_json',
        'settings_json', 'seo_json', 'is_public', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'content_json' => 'array',
            'settings_json' => 'array',
            'seo_json' => 'array',
            'is_public' => 'boolean',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
