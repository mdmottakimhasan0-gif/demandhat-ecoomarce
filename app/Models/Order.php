<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'phone',
        'ip_address',
        'address',
        'subtotal',
        'delivery_fee',
        'grand_total',
        'payment_method',
        'transaction_id',
        'payment_status',
        'order_status',
        'assigned_to',
        'authorized_by',
        'courier_invoice_id',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'grand_total' => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    // NEW: The employee who confirmed/authorized the order
    public function authorizer()
    {
        return $this->belongsTo(User::class, 'authorized_by');
    }


}