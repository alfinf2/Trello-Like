<?php

namespace App\Actions\Profile;

use App\Actions\Profile\Concerns\RevokesOtherTokens;
use App\Models\User;

class UpdateProfileAction
{
    use RevokesOtherTokens;

    /** @param  array{name?: string, email?: string}  $data */
    public function handle(User $user, array $data): User
    {
        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;

        $user->fill($data);

        if ($emailChanged) {
            $user->forceFill(['email_verified_at' => null]);
        }

        $user->save();

        $this->revokeOtherTokens($user);

        return $user->refresh();
    }
}
