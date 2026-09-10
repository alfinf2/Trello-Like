<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\Column;
use App\Models\User;
use App\Policies\Concerns\HandlesBoardMembership;

class ColumnPolicy
{
    use HandlesBoardMembership;

    public function view(User $user, Column $column): bool
    {
        return $this->canAccess($user, $this->boardFor($column));
    }

    public function create(User $user, Board $board): bool
    {
        return $this->canManage($user, $board);
    }

    public function update(User $user, Column $column): bool
    {
        return $this->canManage($user, $this->boardFor($column));
    }

    public function delete(User $user, Column $column): bool
    {
        return $this->canManage($user, $this->boardFor($column));
    }

    public function reorder(User $user, Board $board): bool
    {
        return $this->canManage($user, $board);
    }

    private function boardFor(Column $column): Board
    {
        return $column->loadMissing('board')->board;
    }
}
