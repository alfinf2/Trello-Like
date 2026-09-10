<?php

namespace App\Actions\Label;

use App\Models\Board;
use App\Models\Label;
use Illuminate\Validation\ValidationException;

class CreateLabelAction
{
    public function handle(Board $board, string $name, string $color): Label
    {
        if (Label::where('board_id', $board->id)->where('name', $name)->exists()) {
            throw ValidationException::withMessages([
                'name' => __('A label with this name already exists on this board.'),
            ]);
        }

        return Label::create([
            'board_id' => $board->id,
            'name' => $name,
            'color' => $color,
        ]);
    }
}
