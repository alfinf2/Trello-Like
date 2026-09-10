<?php

namespace App\Actions\Profile;

use App\Models\User;

class DeleteAccountAction
{
    public function handle(User $user): void
    {
        $user->tokens()->delete();

        $user->delete();
    }
}
