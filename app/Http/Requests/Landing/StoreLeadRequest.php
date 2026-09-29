<?php

namespace App\Http\Requests\Landing;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Public submission. Field level validation is generated from the published form
 * definition inside LeadService; this class validates the envelope.
 */
class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'form' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9_-]+$/'],
            'event_id' => ['nullable', 'string', 'max:64'],
            'landing_url' => ['nullable', 'string', 'max:2000'],
            'referrer' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
