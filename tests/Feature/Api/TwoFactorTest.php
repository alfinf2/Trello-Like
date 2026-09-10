<?php

use App\Models\User;
use Laravel\Fortify\Fortify;
use PragmaRX\Google2FA\Google2FA;

function twoFactorHeaders(User $user): array
{
    return [
        'Authorization' => 'Bearer '.$user->createToken('two-factor-test')->plainTextToken,
        'Accept' => 'application/json',
    ];
}

test('two-factor endpoints require authentication', function () {
    $this->getJson('/api/v1/two-factor')->assertUnauthorized();
    $this->postJson('/api/v1/two-factor')->assertUnauthorized();
    $this->putJson('/api/v1/two-factor')->assertUnauthorized();
    $this->deleteJson('/api/v1/two-factor')->assertUnauthorized();
    $this->getJson('/api/v1/two-factor/recovery-codes')->assertUnauthorized();
    $this->putJson('/api/v1/two-factor/recovery-codes')->assertUnauthorized();
});

test('status returns false when 2FA is not enabled', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->getJson('/api/v1/two-factor')
        ->assertOk()
        ->assertJsonPath('data.enabled', false)
        ->assertJsonPath('data.confirming', false);
});

test('enable returns setup key, QR svg, and recovery codes', function () {
    $user = User::factory()->create();

    $response = $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $response->assertJsonStructure([
        'data' => [
            'setup_key',
            'qr_svg',
            'recovery_codes',
        ],
    ]);

    $response->assertJson(fn ($json) => $json
        ->has('data.qr_svg')
        ->has('data.setup_key')
    );

    $this->assertCount(8, $response->json('data.recovery_codes'));
    expect($response->json('data.qr_svg'))->toContain('<svg');
});

test('status shows confirming when secret is set but not confirmed', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $this->withHeaders(twoFactorHeaders($user))
        ->getJson('/api/v1/two-factor')
        ->assertOk()
        ->assertJsonPath('data.enabled', false)
        ->assertJsonPath('data.confirming', true);
});

test('enable with force=true regenerates secret when already enabled', function () {
    $user = User::factory()->create();

    $first = $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $firstKey = $first->json('data.setup_key');

    $second = $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor', ['force' => true])
        ->assertOk();

    expect($second->json('data.setup_key'))->not->toBe($firstKey);
});

test('confirm with valid code succeeds', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $user->refresh();

    $secret = Fortify::currentEncrypter()->decrypt($user->two_factor_secret);
    $code = app(Google2FA::class)->getCurrentOtp($secret);

    $this->withHeaders(twoFactorHeaders($user))
        ->putJson('/api/v1/two-factor', ['code' => $code])
        ->assertOk()
        ->assertJsonPath('message', 'Two factor authentication enabled.');

    $user->refresh();
    expect($user->two_factor_confirmed_at)->not->toBeNull();
});

test('confirm with invalid code fails with validation error', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $this->withHeaders(twoFactorHeaders($user))
        ->putJson('/api/v1/two-factor', ['code' => '000000'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['code']);
});

test('confirm without code fails validation', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $this->withHeaders(twoFactorHeaders($user))
        ->putJson('/api/v1/two-factor')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['code']);
});

test('disable clears 2FA secret', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $user->refresh();
    expect($user->two_factor_secret)->not->toBeNull();

    $this->withHeaders(twoFactorHeaders($user))
        ->deleteJson('/api/v1/two-factor')
        ->assertOk()
        ->assertJsonPath('message', 'Two factor authentication disabled.');

    $user->refresh();
    expect($user->two_factor_secret)->toBeNull();
    expect($user->two_factor_recovery_codes)->toBeNull();
    expect($user->two_factor_confirmed_at)->toBeNull();
});

test('status returns true after 2FA is confirmed', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $user->refresh();
    $secret = Fortify::currentEncrypter()->decrypt($user->two_factor_secret);
    $code = app(Google2FA::class)->getCurrentOtp($secret);

    $this->withHeaders(twoFactorHeaders($user))
        ->putJson('/api/v1/two-factor', ['code' => $code])
        ->assertOk();

    $this->withHeaders(twoFactorHeaders($user))
        ->getJson('/api/v1/two-factor')
        ->assertOk()
        ->assertJsonPath('data.enabled', true)
        ->assertJsonPath('data.confirming', false);
});

test('recovery codes returns empty array when 2FA is not enabled', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->getJson('/api/v1/two-factor/recovery-codes')
        ->assertOk()
        ->assertJson(['data' => []]);
});

test('recovery codes returns 8 codes when 2FA is enabled', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $response = $this->withHeaders(twoFactorHeaders($user))
        ->getJson('/api/v1/two-factor/recovery-codes')
        ->assertOk();

    $this->assertCount(8, $response->json('data'));
});

test('recovery codes can be regenerated', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $originalCodes = $this->withHeaders(twoFactorHeaders($user))
        ->getJson('/api/v1/two-factor/recovery-codes')
        ->json('data');

    $response = $this->withHeaders(twoFactorHeaders($user))
        ->putJson('/api/v1/two-factor/recovery-codes')
        ->assertOk();

    $newCodes = $response->json('data');

    $this->assertCount(8, $newCodes);
    expect($newCodes)->not->toBe($originalCodes);
});

test('recovery codes returns empty array after disable', function () {
    $user = User::factory()->create();

    $this->withHeaders(twoFactorHeaders($user))
        ->postJson('/api/v1/two-factor')
        ->assertOk();

    $this->withHeaders(twoFactorHeaders($user))
        ->deleteJson('/api/v1/two-factor')
        ->assertOk();

    $this->withHeaders(twoFactorHeaders($user))
        ->getJson('/api/v1/two-factor/recovery-codes')
        ->assertOk()
        ->assertJson(['data' => []]);
});
