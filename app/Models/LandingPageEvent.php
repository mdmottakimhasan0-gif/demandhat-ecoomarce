<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LandingPageEvent extends Model
{
    public $timestamps = false;

    protected $table = 'landing_page_events';

    protected $fillable = [
        'landing_page_id', 'event_name', 'event_id', 'element_id', 'source',
        'visitor_hash', 'utm_source', 'metadata_json', 'created_at',
    ];

    protected $hidden = ['visitor_hash'];

    protected function casts(): array
    {
        return [
            'metadata_json' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function landingPage(): BelongsTo
    {
        return $this->belongsTo(LandingPage::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(LandingPageEventDelivery::class);
    }
}
