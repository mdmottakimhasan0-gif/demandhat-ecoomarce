<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HeroImage extends Model
{
    protected $fillable = ['image'];

    protected static function boot()
    {
        parent::boot();

        $clearCache = function () {
            cache()->forget('landing_heroes');
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }
}
