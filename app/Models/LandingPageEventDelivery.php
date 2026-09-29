<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingPageEventDelivery extends Model
{
    public $timestamps = false;

    protected $table = 'landing_page_event_deliveries';

    protected $fillable = [
        'landing_page_event_id', 'channel', 'status', 'response_code',
        'error_message', 'sent_at', 'created_at',
    ];

    protected function casts(): array
    {
        return ['sent_at' => 'datetime', 'created_at' => 'datetime'];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(LandingPageEvent::class, 'landing_page_event_id');
    }
}
