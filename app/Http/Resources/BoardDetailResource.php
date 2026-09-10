<?php

namespace App\Http\Resources;

use App\Models\Board;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Board */
class BoardDetailResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'visibility' => $this->visibility,
            'position' => (float) $this->position,
            'owner' => new UserResource($this->whenLoaded('owner')),
            'members' => BoardMemberResource::collection($this->whenLoaded('members')),
            'labels' => LabelResource::collection($this->whenLoaded('labels')),
            'columns' => ColumnResource::collection($this->whenLoaded('columns')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
