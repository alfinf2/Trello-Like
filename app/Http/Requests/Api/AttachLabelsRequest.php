<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class AttachLabelsRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'label_ids' => ['required', 'array', 'max:50'],
            'label_ids.*' => ['integer', 'min:1'],
        ];
    }
}
