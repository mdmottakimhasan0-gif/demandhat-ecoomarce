<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected static function boot()
    {
        parent::boot();

        $clearCache = function () {
            cache()->forget('landing_products');
            cache()->forget('all_offer_products');
        };

        static::saved($clearCache);
        static::deleted($clearCache);
    }

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'brand',
        'color',
        'weight',
        'length',
        'width',
        'price',
        'stock',
        'description',
        'specification',
        'image',
        'quick_view',
        'short_description',
        'sku',
        'bussiness_class',
        'discount',
        'initial_rating' // <-- Added
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'weight' => 'float',
        'length' => 'float',
        'width' => 'float',
        'stock' => 'integer',
        'discount' => 'float',
        'initial_rating' => 'float', // <-- Added
    ];

    // Automatically append these virtual fields when sending data to React
    protected $appends = ['display_rating', 'display_review_count'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    // --- YOUR CUSTOM RATING LOGIC ---

    public function getDisplayReviewCountAttribute()
    {
        // Always return the REAL count of approved reviews (Starts at 0)
        return $this->reviews->where('is_approved', true)->count();
    }

    public function getDisplayRatingAttribute()
    {
        $realAverage = $this->reviews->where('is_approved', true)->avg('rating') ?? 0;
        $initial = $this->initial_rating ?? 0;

        // If real average exceeds the initial rating, show the real average.
        // Otherwise, keep showing the initial rating.
        if ($realAverage > $initial) {
            return round($realAverage, 1);
        }

        return $initial;
    }
}