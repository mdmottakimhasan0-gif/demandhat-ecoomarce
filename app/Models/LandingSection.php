<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingSection extends Model
{
    protected $fillable = [
        'category_name',
        'category_id',
    ];

    protected static function boot()
    {
        parent::boot();

        $clearCache = function () {
            cache()->forget('landing_sections');
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }


}
