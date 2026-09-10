<?php

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Task */
class TaskDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'column_id' => $this->column_id,
            'board_id' => $this->whenLoaded('column', fn (): int => $this->column->board_id),
            'title' => $this->title,
            'description' => $this->description,
            'position' => (float) $this->position,
            'priority' => $this->priority,
            'due_date' => $this->due_date,
            'is_completed' => $this->is_completed,
            'completed_at' => $this->completed_at,
            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'labels' => LabelResource::collection($this->whenLoaded('labels')),
            'activities' => ActivityResource::collection($this->whenLoaded('activities')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
