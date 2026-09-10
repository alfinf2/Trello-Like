<?php

namespace App\Http\Resources;

use App\Models\Column;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Column */
class ColumnResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $tasks = $this->relationLoaded('tasks')
            ? $this->tasks->unique('id')->values()
            : null;

        return [
            'id' => $this->id,
            'board_id' => $this->board_id,
            'name' => $this->name,
            'position' => (float) $this->position,
            'tasks' => $tasks !== null ? TaskResource::collection($tasks) : $this->whenCounted('tasks', $this->tasks_count),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
