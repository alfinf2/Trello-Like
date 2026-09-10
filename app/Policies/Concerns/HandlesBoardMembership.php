<?php

namespace App\Policies\Concerns;

use App\Models\Board;
use App\Models\User;

trait HandlesBoardMembership
{
    protected function canAccess(User $user, Board $board): bool
    {
        return $board->isOwner($user->id)
            || $board->members()->whereKey($user->id)->exists();
    }

    protected function canManage(User $user, Board $board): bool
    {
        if ($board->isOwner($user->id)) {
            return true;
        }

        return $board->members()
            ->wherePivot('role', 'admin')
            ->whereKey($user->id)
            ->exists();
    }
}
