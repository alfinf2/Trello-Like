<?php

namespace App\Models;

use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $column_id
 * @property int $creator_id
 * @property int|null $assignee_id
 * @property string $title
 * @property string|null $description
 * @property string $position
 * @property string $priority
 * @property Carbon|null $due_date
 * @property bool $is_completed
 * @property Carbon|null $completed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Column $column
 * @property-read User $creator
 * @property-read User|null $assignee
 * @property-read Collection<int, Label> $labels
 * @property-read Collection<int, TaskActivity> $activities
 */
#[Fillable([
    'column_id', 'creator_id', 'assignee_id', 'title', 'description',
    'position', 'priority', 'due_date', 'is_completed', 'completed_at',
])]
#[Hidden(['deleted_at'])]
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory, SoftDeletes;

    /** @return BelongsTo<Column, $this> */
    public function column(): BelongsTo
    {
        return $this->belongsTo(Column::class);
    }

    /** @return BelongsTo<User, $this> */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /** @return BelongsToMany<Label, $this> */
    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'task_label')
            ->withTimestamps();
    }

    /** @return HasMany<TaskActivity, $this> */
    public function activities(): HasMany
    {
        return $this->hasMany(TaskActivity::class)->latest();
    }

    protected function casts(): array
    {
        return [
            'position' => 'decimal:2',
            'due_date' => 'date',
            'completed_at' => 'datetime',
            'is_completed' => 'boolean',
        ];
    }
}
