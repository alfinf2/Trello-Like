<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

function tokenHeaders(User $user): array
{
    return [
        'Authorization' => 'Bearer '.$user->createToken('profile-test')->plainTextToken,
        'Accept' => 'application/json',
    ];
}

test('profile endpoints require authentication', function () {
    $this->putJson('/api/v1/profile')->assertUnauthorized();
    $this->deleteJson('/api/v1/profile')->assertUnauthorized();
});

test('profile name and email can be updated', function () {
    $user = User::factory()->create([
        'email' => 'before@example.com',
        'email_verified_at' => now(),
    ]);
    $user->createToken('other-device');

    $this->withHeaders(tokenHeaders($user))
        ->putJson('/api/v1/profile', [
            'name' => 'Updated Name',
            'email' => 'after@example.com',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Updated Name')
        ->assertJsonPath('data.email', 'after@example.com');

    $user->refresh();
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'name' => 'Updated Name',
        'email' => 'after@example.com',
    ]);
    expect($user->email_verified_at)->toBeNull();
    expect($user->tokens()->count())->toBe(1);
});

test('profile rejects an email already in use', function () {
    $user = User::factory()->create(['email' => 'mine@example.com']);
    User::factory()->create(['email' => 'taken@example.com']);

    $this->withHeaders(tokenHeaders($user))
        ->putJson('/api/v1/profile', ['email' => 'taken@example.com'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('profile validates input', function () {
    $user = User::factory()->create();

    $this->withHeaders(tokenHeaders($user))
        ->putJson('/api/v1/profile', ['name' => '', 'email' => 'not-an-email'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name', 'email']);
});

test('password can be updated with the correct current password', function () {
    $user = User::factory()->create(['password' => bcrypt('old-password')]);
    $user->createToken('other-device');

    $this->withHeaders(tokenHeaders($user))
        ->putJson('/api/v1/profile/password', [
            'current_password' => 'old-password',
            'password' => 'new-secret-password',
            'password_confirmation' => 'new-secret-password',
        ])
        ->assertOk()
        ->assertJsonPath('message', 'Password updated.');

    $user->refresh();
    expect(Hash::check('new-secret-password', $user->password))->toBeTrue();
    expect($user->tokens()->count())->toBe(1);

    $this->postJson('/api/v1/login', [
        'email' => $user->email,
        'password' => 'new-secret-password',
    ])->assertOk();
});

test('password update rejects an incorrect current password', function () {
    $user = User::factory()->create(['password' => bcrypt('old-password')]);

    $this->withHeaders(tokenHeaders($user))
        ->putJson('/api/v1/profile/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-secret-password',
            'password_confirmation' => 'new-secret-password',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['current_password']);
});

test('account can be deleted with the correct password', function () {
    $user = User::factory()->create(['password' => bcrypt('secret-password')]);

    $this->withHeaders(tokenHeaders($user))
        ->deleteJson('/api/v1/profile', ['password' => 'secret-password'])
        ->assertOk()
        ->assertJsonPath('message', 'Account deleted.');

    $this->assertDatabaseMissing('users', ['id' => $user->id]);
    $this->assertDatabaseCount('personal_access_tokens', 0);
});

test('account deletion rejects an incorrect password', function () {
    $user = User::factory()->create(['password' => bcrypt('secret-password')]);

    $this->withHeaders(tokenHeaders($user))
        ->deleteJson('/api/v1/profile', ['password' => 'wrong-password'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);

    $this->assertDatabaseHas('users', ['id' => $user->id]);
});
