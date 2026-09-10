<?php

use App\Models\User;

test('guests are redirected to the app when visiting the legacy dashboard route', function () {
    $response = $this->get(route('dashboard'));

    $response->assertRedirect('/app');
});

test('the app route serves the SPA for guests', function () {
    $response = $this->get('/app');

    $response->assertOk();
});

test('authenticated users can visit the app', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get('/app');

    $response->assertOk();
});
