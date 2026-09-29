<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Marquee extends Model
{
    protected $fillable = [
        'content',
        'position',
    ];

    protected static function boot()
    {
        parent::boot();

        $clearCache = function () {
            cache()->forget('global_marquee');
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }
}
