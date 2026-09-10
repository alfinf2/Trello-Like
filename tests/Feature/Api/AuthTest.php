<?php

use App\Models\User;

function authHeaders(User $user): array
{
    return [
        'Authorization' => 'Bearer '.$user->createToken('test')->plainTextToken,
        'Accept' => 'application/json',
    ];
}

test('user can register and receives a token', function () {
    $response = $this->postJson('/api/v1/register', [
        'name' => 'New User',
        'email' => 'new@example.com',
        'password' => 'secret-password',
        'password_confirmation' => 'secret-password',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email'], 'token']]);

    $this->assertDatabaseHas('users', ['email' => 'new@example.com']);
});

test('registration validates input', function () {
    $this->postJson('/api/v1/register', [
        'name' => '',
        'email' => 'not-an-email',
        'password' => 'short',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});

test('user can login and receives a token', function () {
    $user = User::factory()->create(['password' => bcrypt('secret-password')]);

    $response = $this->postJson('/api/v1/login', [
        'email' => $user->email,
        'password' => 'secret-password',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['data' => ['user' => ['id', 'name', 'email'], 'token']]);
});

test('login rejects invalid credentials', function () {
    $user = User::factory()->create(['password' => bcrypt('secret-password')]);

    $this->postJson('/api/v1/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('unauthenticated requests are rejected', function () {
    $this->getJson('/api/v1/me')->assertUnauthorized();
    $this->getJson('/api/v1/boards')->assertUnauthorized();
});

test('me returns the authenticated user', function () {
    $user = User::factory()->create();

    $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/me')
        ->assertOk()
        ->assertJsonPath('data.email', $user->email)
        ->assertJsonPath('data.id', $user->id);
});

test('logout revokes the current token', function () {
    $user = User::factory()->create();
    $headers = authHeaders($user);

    $this->withHeaders($headers)
        ->postJson('/api/v1/logout')
        ->assertOk()
        ->assertJsonPath('message', 'Logged out.');

    expect($user->fresh()->tokens()->count())->toBe(0);
    $this->assertDatabaseCount('personal_access_tokens', 0);
});
