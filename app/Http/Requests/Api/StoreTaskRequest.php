<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'column_id' => ['required', 'integer', 'min:1', 'exists:columns,id'],
            'title' => ['required', 'string', 'max:191'],
            'description' => ['nullable', 'string', 'max:10000'],
            'assignee_id' => ['nullable', 'integer', 'min:1', 'exists:users,id'],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'due_date' => ['nullable', 'date'],
            'labels' => ['sometimes', 'array', 'max:50'],
            'labels.*' => ['integer', 'min:1'],
        ];
    }
}
