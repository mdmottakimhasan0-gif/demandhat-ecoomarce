<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class LandingPageMedia extends Model
{
    protected $table = 'landing_page_media';

    protected $fillable = [
        'uploaded_by', 'disk', 'path', 'original_name', 'mime', 'size', 'width', 'height', 'alt',
    ];

    protected $appends = ['url'];

    public function getUrlAttribute(): string
    {
        // Root-relative so it works on any host/port the site is served from.
        return '/storage/'.ltrim($this->path, '/');
    }

    public function deleteFile(): void
    {
        Storage::disk($this->disk)->delete($this->path);
    }
}
