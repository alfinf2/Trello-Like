<?php

use App\Models\User;
use Illuminate\Support\Facades\URL;

function verificationAuthHeaders(User $user): array
{
    return [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
        'Accept' => 'application/json',
    ];
}

test('unauthenticated user cannot send verification notification', function () {
    $this->postJson('/api/v1/email/verification-notification')
        ->assertUnauthorized();
});

test('authenticated user can send verification notification', function () {
    $user = User::factory()->create();

    $this->withHeaders(verificationAuthHeaders($user))
        ->postJson('/api/v1/email/verification-notification')
        ->assertOk()
        ->assertJsonPath('message', 'Verification link sent.');
});

test('signed verification url verifies email', function () {
    $user = User::factory()->create([
        'email_verified_at' => null,
    ]);

    $this->assertNull($user->email_verified_at);

    $url = URL::temporarySignedRoute(
        'verification.verify',
        now()->addMinutes(60),
        ['id' => $user->id, 'hash' => sha1($user->email)],
    );

    $this->actingAs($user)->get($url)
        ->assertRedirect(route('home'));

    $this->assertNotNull($user->fresh()->email_verified_at);
});
