<?php

namespace App\Actions\Column;

use App\Models\Board;
use App\Models\Column;
use App\Services\PositionService;

class CreateColumnAction
{
    public function __construct(private readonly PositionService $positions) {}

    public function handle(Board $board, string $name): Column
    {
        $position = $this->positions->next(Column::where('board_id', $board->id));

        return Column::create([
            'board_id' => $board->id,
            'name' => $name,
            'position' => $position,
        ]);
    }
}
