<?php

namespace App\Http\Requests\Landing;

use Illuminate\Foundation\Http\FormRequest;

class PublishLandingPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('publish', $this->route('landingPage')) ?? false;
    }

    public function rules(): array
    {
        return [];
    }
}
