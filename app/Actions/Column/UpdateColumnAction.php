<?php

namespace App\Actions\Column;

use App\Models\Column;

class UpdateColumnAction
{
    public function handle(Column $column, string $name): Column
    {
        $column->update(['name' => $name]);

        return $column->refresh();
    }
}
