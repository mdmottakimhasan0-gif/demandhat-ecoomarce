<?php

namespace App\Http\Requests\Landing;

use App\Rules\AvailableLandingSlug;
use App\Services\Landing\LandingSlug;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreLandingPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('landing_pages.create');
    }

    protected function prepareForValidation(): void
    {
        $slug = (string) $this->input('slug', '');
        $this->merge(['slug' => $slug !== '' ? LandingSlug::normalize($slug) : LandingSlug::normalize((string) $this->input('title', ''))]);
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'slug' => ['required', 'string', 'max:80', new AvailableLandingSlug],
            'template_id' => ['nullable', 'integer', 'exists:landing_page_templates,id'],
        ];
    }
}
