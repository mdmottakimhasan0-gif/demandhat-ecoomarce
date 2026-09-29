<?php

namespace App\Rules;

use App\Services\Landing\LandingSlug;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class AvailableLandingSlug implements ValidationRule
{
    public function __construct(private ?int $ignoreId = null) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $slug = (string) $value;

        if (! preg_match(LandingSlug::PATTERN, $slug)) {
            $fail('The slug may only contain lowercase letters, numbers and single dashes.');

            return;
        }
        if (LandingSlug::isReserved($slug)) {
            $fail('This URL is reserved by the website. Please choose another slug.');

            return;
        }
        if (LandingSlug::taken($slug, $this->ignoreId)) {
            $fail('This slug is already in use.');
        }
    }
}
