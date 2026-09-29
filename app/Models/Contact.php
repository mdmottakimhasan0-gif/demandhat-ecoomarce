<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'phone',
        'whatsapp',
    ];

    protected static function boot()
    {
        parent::boot();

        $clearCache = function () {
            cache()->forget('global_contact');
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }
}