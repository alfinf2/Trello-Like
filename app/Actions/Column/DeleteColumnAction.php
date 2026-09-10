<?php

namespace App\Actions\Column;

use App\Models\Column;

class DeleteColumnAction
{
    public function handle(Column $column): void
    {
        $column->delete();
    }
}
