<?php

namespace App\Http\Requests\Landing;

use App\Rules\AvailableLandingSlug;
use App\Services\Landing\LandingSlug;
use Illuminate\Foundation\Http\FormRequest;

/** Used by the builder's Save and Autosave endpoints. */
class UpdateLandingPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('landingPage')) ?? false;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('slug')) {
            $this->merge(['slug' => LandingSlug::normalize((string) $this->input('slug'))]);
        }
    }

    public function rules(): array
    {
        $page = $this->route('landingPage');

        return [
            'title' => ['sometimes', 'string', 'max:200'],
            'slug' => ['sometimes', 'string', 'max:80', new AvailableLandingSlug($page?->id)],
            'content' => ['sometimes', 'array'],
            'content.sections' => ['sometimes', 'array'],
            'settings' => ['sometimes', 'array'],
            'seo' => ['sometimes', 'array'],
        ];
    }
}
