<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\User;
use App\Policies\Concerns\HandlesBoardMembership;

class BoardPolicy
{
    use HandlesBoardMembership;

    public function create(User $user): bool
    {
        return true;
    }

    public function view(User $user, Board $board): bool
    {
        return $this->canAccess($user, $board) || $board->visibility === 'public';
    }

    public function update(User $user, Board $board): bool
    {
        return $this->canManage($user, $board);
    }

    public function delete(User $user, Board $board): bool
    {
        return $board->isOwner($user->id);
    }

    public function manageMembers(User $user, Board $board): bool
    {
        return $this->canManage($user, $board);
    }
}
