<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:191'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'assignee_id' => ['sometimes', 'nullable', 'integer', 'min:1', 'exists:users,id'],
            'priority' => ['sometimes', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'due_date' => ['sometimes', 'nullable', 'date'],
            'is_completed' => ['sometimes', 'boolean'],
        ];
    }
}
