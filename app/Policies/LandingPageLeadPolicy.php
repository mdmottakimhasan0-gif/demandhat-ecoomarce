<?php

namespace App\Policies;

use App\Models\LandingPageLead;
use App\Models\User;
use App\Services\Landing\LandingPermissions as P;

class LandingPageLeadPolicy
{
    public function viewAny(User $user): bool
    {
        return P::allows($user, 'landing_pages.leads');
    }

    public function view(User $user, LandingPageLead $lead): bool
    {
        return P::allows($user, 'landing_pages.leads');
    }

    public function update(User $user, LandingPageLead $lead): bool
    {
        return P::allows($user, 'landing_pages.leads');
    }

    public function delete(User $user, LandingPageLead $lead): bool
    {
        return P::allows($user, 'landing_pages.delete');
    }
}
