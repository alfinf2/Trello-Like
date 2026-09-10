<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class ReorderColumnsRequest extends FormRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'columns' => ['required', 'array', 'min:1', 'max:500'],
            'columns.*' => ['required', 'array:id,position'],
            'columns.*.id' => ['required', 'integer', 'min:1'],
            'columns.*.position' => ['required', 'numeric', 'min:0', 'max:99999999'],
        ];
    }
}
