<?php

namespace App\Policies;

use App\Models\LandingPageTemplate;
use App\Models\User;
use App\Services\Landing\LandingPermissions as P;

class LandingPageTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return P::allows($user, 'landing_pages.templates');
    }

    public function view(User $user, LandingPageTemplate $template): bool
    {
        return P::allows($user, 'landing_pages.templates');
    }

    public function create(User $user): bool
    {
        return P::allows($user, 'landing_pages.templates');
    }

    public function update(User $user, LandingPageTemplate $template): bool
    {
        return P::allows($user, 'landing_pages.templates');
    }

    public function delete(User $user, LandingPageTemplate $template): bool
    {
        return P::allows($user, 'landing_pages.templates');
    }
}
