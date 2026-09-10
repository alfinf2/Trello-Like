<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class MoveTaskRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'column_id' => ['required', 'integer', 'min:1', 'exists:columns,id'],
            'position' => ['required', 'numeric', 'min:0', 'max:99999999'],
        ];
    }
}
