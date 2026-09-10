<?php

namespace App\Actions\Board;

use App\Models\Board;

class RemoveBoardMemberAction
{
    public function handle(Board $board, int $userId): void
    {
        $board->members()->detach($userId);
    }
}
