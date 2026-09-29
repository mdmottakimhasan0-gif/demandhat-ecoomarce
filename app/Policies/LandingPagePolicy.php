<?php

namespace App\Policies;

use App\Models\LandingPage;
use App\Models\User;
use App\Services\Landing\LandingPermissions as P;

class LandingPagePolicy
{
    public function viewAny(User $user): bool
    {
        return P::allows($user, 'landing_pages.view');
    }

    public function view(User $user, LandingPage $page): bool
    {
        return P::allows($user, 'landing_pages.view');
    }

    public function create(User $user): bool
    {
        return P::allows($user, 'landing_pages.create');
    }

    public function update(User $user, LandingPage $page): bool
    {
        return P::allows($user, 'landing_pages.edit');
    }

    public function publish(User $user, LandingPage $page): bool
    {
        return P::allows($user, 'landing_pages.publish');
    }

    public function delete(User $user, LandingPage $page): bool
    {
        return P::allows($user, 'landing_pages.delete');
    }

    public function manageTracking(User $user, LandingPage $page): bool
    {
        return P::allows($user, 'landing_pages.tracking');
    }

    public function viewAnalytics(User $user, ?LandingPage $page = null): bool
    {
        return P::allows($user, 'landing_pages.analytics');
    }
}
