<?php

namespace App\Http\Requests\Landing;

use App\Models\LandingPageTemplate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('landing_pages.templates');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
            'category' => ['required', Rule::in(LandingPageTemplate::CATEGORIES)],
            'thumbnail' => ['nullable', 'url', 'max:500'],
            'is_public' => ['sometimes', 'boolean'],
            'landing_page_id' => ['nullable', 'integer', 'exists:landing_pages,id'],
            // Optional: save just one element/section (from the builder context menu).
            'element' => ['nullable', 'array'],
            'element.type' => ['required_with:element', 'string', 'max:40'],
        ];
    }
}
