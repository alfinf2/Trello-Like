<?php

namespace App\Actions\Board;

use App\Models\Board;
use App\Models\Column;
use App\Models\User;
use App\Services\PositionService;
use Illuminate\Support\Facades\DB;

class CreateBoardAction
{
    public function __construct(private readonly PositionService $positions) {}

    public function handle(User $owner, string $name, ?string $description = null, string $visibility = 'private'): Board
    {
        $position = $this->positions->next(Board::where('user_id', $owner->id));

        return DB::transaction(function () use ($owner, $name, $description, $visibility, $position): Board {
            $board = Board::create([
                'user_id' => $owner->id,
                'name' => $name,
                'description' => $description,
                'visibility' => $visibility,
                'position' => $position,
            ]);

            $defaultColumns = ['To Do', 'In Progress', 'Done'];

            foreach ($defaultColumns as $index => $columnName) {
                Column::create([
                    'board_id' => $board->id,
                    'name' => $columnName,
                    'position' => $index + 1,
                ]);
            }

            return $board;
        });
    }
}
