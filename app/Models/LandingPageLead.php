<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingPageLead extends Model
{
    public const STATUSES = ['new', 'contacted', 'qualified', 'converted', 'lost'];

    public $timestamps = false;

    protected $table = 'landing_page_leads';

    protected $fillable = [
        'landing_page_id', 'form_id', 'name', 'email', 'phone', 'data_json', 'source',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'landing_url', 'referrer', 'ip_hash', 'user_agent', 'status', 'created_at',
    ];

    protected $hidden = ['ip_hash'];

    protected function casts(): array
    {
        return [
            'data_json' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function landingPage(): BelongsTo
    {
        return $this->belongsTo(LandingPage::class);
    }
}
