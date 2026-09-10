<?php

namespace App\Actions\Board;

use App\Models\Board;

class UpdateBoardAction
{
    /** @param  array<string, mixed>  $data */
    public function handle(Board $board, array $data): Board
    {
        $board->update($data);

        return $board->refresh();
    }
}
