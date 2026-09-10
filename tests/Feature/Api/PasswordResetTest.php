<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

test('unauthenticated user can request password reset link', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/api/v1/forgot-password', [
        'email' => $user->email,
    ]);

    $response->assertOk()
        ->assertJsonStructure(['message']);
});

test('forgot password returns success even for non-existent email', function () {
    $response = $this->postJson('/api/v1/forgot-password', [
        'email' => 'nonexistent@example.com',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['message']);
});

test('forgot password validates email', function () {
    $this->postJson('/api/v1/forgot-password', [
        'email' => 'not-an-email',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('user can reset password with valid token', function () {
    $user = User::factory()->create();

    $rawToken = Str::random(64);
    DB::table('password_reset_tokens')->insert([
        'email' => $user->email,
        'token' => Hash::make($rawToken),
        'created_at' => now(),
    ]);

    $response = $this->postJson('/api/v1/reset-password', [
        'email' => $user->email,
        'token' => $rawToken,
        'password' => 'new-secret-password',
        'password_confirmation' => 'new-secret-password',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['message']);

    $loginResponse = $this->postJson('/api/v1/login', [
        'email' => $user->email,
        'password' => 'new-secret-password',
    ]);

    $loginResponse->assertOk();
});

test('reset fails with invalid token', function () {
    $user = User::factory()->create();

    $response = $this->postJson('/api/v1/reset-password', [
        'email' => $user->email,
        'token' => 'invalid-token',
        'password' => 'new-secret-password',
        'password_confirmation' => 'new-secret-password',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('reset fails with mismatched email', function () {
    $user = User::factory()->create();

    $rawToken = Str::random(64);
    DB::table('password_reset_tokens')->insert([
        'email' => $user->email,
        'token' => Hash::make($rawToken),
        'created_at' => now(),
    ]);

    $response = $this->postJson('/api/v1/reset-password', [
        'email' => 'other@example.com',
        'token' => $rawToken,
        'password' => 'new-secret-password',
        'password_confirmation' => 'new-secret-password',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('forgot password is rate limited', function () {
    $user = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/v1/forgot-password', [
            'email' => $user->email,
        ])->assertOk();
    }

    $this->postJson('/api/v1/forgot-password', [
        'email' => $user->email,
    ])->assertStatus(429);
});
