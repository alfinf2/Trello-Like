<?php

namespace App\Actions\Profile;

use App\Actions\Profile\Concerns\RevokesOtherTokens;
use App\Models\User;

class UpdatePasswordAction
{
    use RevokesOtherTokens;

    public function handle(User $user, string $password): User
    {
        $user->update(['password' => $password]);

        $this->revokeOtherTokens($user);

        return $user->refresh();
    }
}
