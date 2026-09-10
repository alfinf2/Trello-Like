<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $task_id
 * @property int $user_id
 * @property string $type
 * @property array<mixed>|null $old_value
 * @property array<mixed>|null $new_value
 * @property Carbon $created_at
 * @property-read Task $task
 * @property-read User $user
 */
#[Fillable(['task_id', 'user_id', 'type', 'old_value', 'new_value'])]
class TaskActivity extends Model
{
    public const UPDATED_AT = null;

    /** @return BelongsTo<Task, $this> */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    protected function casts(): array
    {
        return [
            'old_value' => 'array',
            'new_value' => 'array',
        ];
    }
}
