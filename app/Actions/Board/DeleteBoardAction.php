<?php

namespace App\Actions\Board;

use App\Models\Board;
use Illuminate\Support\Facades\DB;

class DeleteBoardAction
{
    public function handle(Board $board): void
    {
        DB::transaction(function () use ($board): void {
            $board->columns()->delete();
            $board->delete();
        });
    }
}
