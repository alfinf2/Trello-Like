<?php

namespace App\Actions\Profile\Concerns;

use App\Models\User;

trait RevokesOtherTokens
{
    private function revokeOtherTokens(User $user): void
    {
        $user->tokens()
            ->whereKeyNot($user->currentAccessToken()->getKey())
            ->delete();
    }
}
