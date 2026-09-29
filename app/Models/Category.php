<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Product;

class Category extends Model
{
    protected $fillable = ['name', 'photo'];

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    protected static function boot()
    {
        parent::boot();

        $clearCache = function () {
            cache()->forget('landing_categories');
            cache()->forget('all_categories');
            cache()->forget('all_categories_with_count');
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }
}
