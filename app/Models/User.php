<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * Fields users are allowed to fill from forms.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'address',
        'phone',
        'otp',
        'otp_expires_at',
        'role',
        'email_verified_at',
        'phone_verified_at',
        'remember_token',
        'google2fa_secret',

    ];

    /**
     * Hidden fields.
     */
    protected $hidden = [
        'password',
        'remember_token',
        'otp',
        'google2fa_secret',
    ];

    /**
     * Cast timestamps to carbon instances.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'otp_expires_at' => 'datetime',
    ];

    /**
     * Dynamic role checking for multi-role systems.
     *
     * Usage: $user->hasRole('manager')
     *         $user->hasRole(['admin', 'manager'])
     */
    public function hasRole($roles): bool
    {
        if (is_array($roles)) {
            return in_array($this->role, $roles);
        }

        return $this->role === $roles;
    }

    public function assignedOrders()
    {
        return $this->hasMany(Order::class, 'assigned_to');
    }
}
