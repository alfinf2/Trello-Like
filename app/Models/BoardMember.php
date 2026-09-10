<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class BoardMember extends Pivot
{
    protected $table = 'board_member';

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'role' => 'string',
        ];
    }
}
