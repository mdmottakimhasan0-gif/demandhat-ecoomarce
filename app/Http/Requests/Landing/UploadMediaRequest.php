<?php

namespace App\Http\Requests\Landing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UploadMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('landing_pages.edit');
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:'.config('landing.media.max_kb')],
            'alt' => ['nullable', 'string', 'max:255'],
        ];
    }
}
