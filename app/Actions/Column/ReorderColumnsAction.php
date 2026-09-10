<?php

namespace App\Actions\Column;

use App\Models\Board;
use App\Models\Column;
use Illuminate\Support\Facades\DB;

class ReorderColumnsAction
{
    /** @param  array<int, array{id: int, position: float|string|int}>  $items */
    public function handle(Board $board, array $items): void
    {
        DB::transaction(function () use ($board, $items): void {
            foreach ($items as $item) {
                Column::query()
                    ->whereKey($item['id'])
                    ->where('board_id', $board->id)
                    ->update(['position' => (float) $item['position']]);
            }
        });
    }
}
