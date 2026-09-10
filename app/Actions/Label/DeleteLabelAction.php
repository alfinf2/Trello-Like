<?php

namespace App\Actions\Label;

use App\Models\Label;

class DeleteLabelAction
{
    public function handle(Label $label): void
    {
        $label->delete();
    }
}
