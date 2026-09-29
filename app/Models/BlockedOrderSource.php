<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class BlockedOrderSource extends Model
{
    protected $fillable = ['type', 'value', 'reason', 'created_by'];

    protected static function booted(): void
    {
        $flush = fn () => Cache::forget('order_protection.blocklist');
        static::saved($flush);
        static::deleted($flush);
    }
}
