<?php

namespace App\Http\Requests\Landing;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrackingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageTracking', $this->route('landingPage')) ?? false;
    }

    public function rules(): array
    {
        return [
            'tracking' => ['required', 'array'],
            'tracking.meta' => ['sometimes', 'array'],
            'tracking.capi' => ['sometimes', 'array'],
            'tracking.scripts' => ['sometimes', 'array'],
            'tracking.utm' => ['sometimes', 'array'],
            // Write-only: the token is never returned by any endpoint.
            'capi_access_token' => ['nullable', 'string', 'max:1000'],
            'clear_capi_token' => ['sometimes', 'boolean'],
        ];
    }
}
