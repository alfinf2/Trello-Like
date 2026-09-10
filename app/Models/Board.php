<?php

namespace App\Models;

use Database\Factories\BoardFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $description
 * @property string $visibility
 * @property string $position
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $owner
 * @property-read Collection<int, User> $members
 * @property-read Collection<int, Column> $columns
 * @property-read Collection<int, Task> $tasks
 * @property-read Collection<int, Label> $labels
 */
#[Fillable(['user_id', 'name', 'description', 'visibility', 'position'])]
#[Hidden(['deleted_at'])]
class Board extends Model
{
    /** @use HasFactory<BoardFactory> */
    use HasFactory, SoftDeletes;

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsToMany<User, $this, BoardMember, 'pivot'> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'board_member', 'board_id', 'user_id')
            ->using(BoardMember::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /** @return HasMany<Column, $this> */
    public function columns(): HasMany
    {
        return $this->hasMany(Column::class)->orderBy('position');
    }

    /** @return HasManyThrough<Task, Column, $this> */
    public function tasks(): HasManyThrough
    {
        return $this->hasManyThrough(Task::class, Column::class);
    }

    /** @return HasMany<Label, $this> */
    public function labels(): HasMany
    {
        return $this->hasMany(Label::class);
    }

    public function hasMember(int $userId): bool
    {
        return $this->members()->whereKey($userId)->exists();
    }

    public function memberRole(int $userId): ?string
    {
        return $this->members()->whereKey($userId)->first()?->pivot->role;
    }

    public function isOwner(int $userId): bool
    {
        return $this->user_id === $userId;
    }

    protected function casts(): array
    {
        return [
            'position' => 'decimal:2',
        ];
    }
}
