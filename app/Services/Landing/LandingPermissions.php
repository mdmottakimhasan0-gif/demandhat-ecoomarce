<?php

namespace App\Services\Landing;

use App\Models\User;

/**
 * Maps the application's existing user roles to landing page permissions
 * (config/landing.php). No extra permission package is needed.
 */
class LandingPermissions
{
    public static function allows(?User $user, string $permission): bool
    {
        if (! $user) {
            return false;
        }
        $granted = (array) config('landing.permissions.'.$user->role, []);

        return in_array('*', $granted, true) || in_array($permission, $granted, true);
    }

    /** @return list<string> permissions granted to the user (used by the UI to hide actions) */
    public static function for(?User $user): array
    {
        return array_values(array_filter(
            config('landing.all_permissions'),
            fn ($p) => self::allows($user, $p)
        ));
    }
}
