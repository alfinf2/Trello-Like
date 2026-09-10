<?php

namespace App\Actions\Board;

use App\Models\Board;
use App\Models\User;

class AddBoardMemberAction
{
    public function handle(Board $board, string $email, string $role = 'member'): User
    {
        $user = User::where('email', $email)->firstOrFail();

        if ($board->isOwner($user->id)) {
            return $user;
        }

        $board->members()->syncWithoutDetaching([
            $user->id => ['role' => $role],
        ]);

        return $user;
    }
}
