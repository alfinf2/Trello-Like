<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\Task;
use App\Models\User;
use App\Policies\Concerns\HandlesBoardMembership;

class TaskPolicy
{
    use HandlesBoardMembership;

    public function view(User $user, Task $task): bool
    {
        return $this->canAccess($user, $this->boardFor($task));
    }

    public function create(User $user, Board $board): bool
    {
        return $this->canAccess($user, $board);
    }

    public function update(User $user, Task $task): bool
    {
        return $this->canAccess($user, $this->boardFor($task));
    }

    public function move(User $user, Task $task): bool
    {
        return $this->canAccess($user, $this->boardFor($task));
    }

    public function delete(User $user, Task $task): bool
    {
        return $this->canAccess($user, $this->boardFor($task));
    }

    public function manageLabels(User $user, Task $task): bool
    {
        return $this->canAccess($user, $this->boardFor($task));
    }

    private function boardFor(Task $task): Board
    {
        $task->loadMissing('column.board');

        return $task->column->board;
    }
}
