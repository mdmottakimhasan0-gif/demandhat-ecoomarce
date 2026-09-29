<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingPageVersion extends Model
{
    public $timestamps = false;

    protected $table = 'landing_page_versions';

    protected $fillable = [
        'landing_page_id', 'version_number', 'label', 'content_json', 'settings_json',
        'seo_json', 'tracking_json', 'created_by', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'content_json' => 'array',
            'settings_json' => 'array',
            'seo_json' => 'array',
            'tracking_json' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function landingPage(): BelongsTo
    {
        return $this->belongsTo(LandingPage::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
