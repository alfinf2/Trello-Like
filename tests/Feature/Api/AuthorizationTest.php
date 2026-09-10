<?php

use App\Models\Board;
use App\Models\User;

test('stranger cannot view a private board', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $board = Board::factory()->create([
        'user_id' => $owner->id,
        'visibility' => 'private',
    ]);

    $this->withHeaders(authHeaders($stranger))
        ->getJson('/api/v1/boards/'.$board->id)
        ->assertForbidden();
});

test('stranger cannot mutate a board', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $owner->id]);

    foreach (['put', 'delete'] as $method) {
        $this->withHeaders(authHeaders($stranger))
            ->{$method.'Json'}('/api/v1/boards/'.$board->id, ['name' => 'Hacked'])
            ->assertForbidden();
    }
});

test('stranger cannot manage members or columns', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $member = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $owner->id]);

    $this->withHeaders(authHeaders($stranger))
        ->postJson('/api/v1/boards/'.$board->id.'/members', ['email' => $member->email])
        ->assertForbidden();

    $this->withHeaders(authHeaders($stranger))
        ->postJson('/api/v1/boards/'.$board->id.'/columns', ['name' => 'New'])
        ->assertForbidden();
});

test('member without admin role can view but cannot manage', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $owner->id]);
    $board->members()->attach($member->id, ['role' => 'member']);

    $this->withHeaders(authHeaders($member))
        ->getJson('/api/v1/boards/'.$board->id)
        ->assertOk();

    $this->withHeaders(authHeaders($member))
        ->putJson('/api/v1/boards/'.$board->id, ['name' => 'Nope'])
        ->assertForbidden();

    $this->withHeaders(authHeaders($member))
        ->postJson('/api/v1/boards/'.$board->id.'/columns', ['name' => 'Nope'])
        ->assertForbidden();
});

test('admin member can manage the board', function () {
    $owner = User::factory()->create();
    $admin = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $owner->id]);
    $board->members()->attach($admin->id, ['role' => 'admin']);

    $this->withHeaders(authHeaders($admin))
        ->postJson('/api/v1/boards/'.$board->id.'/columns', ['name' => 'Sprint 10'])
        ->assertCreated();
});

test('stranger can view a public board', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $board = Board::factory()->create([
        'user_id' => $owner->id,
        'visibility' => 'public',
    ]);

    $this->withHeaders(authHeaders($stranger))
        ->getJson('/api/v1/boards/'.$board->id)
        ->assertOk();
});

test('public boards are read-only for strangers', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $board = Board::factory()->create([
        'user_id' => $owner->id,
        'visibility' => 'public',
    ]);
    $column = $board->columns()->create(['name' => 'Backlog', 'position' => 1]);

    $this->withHeaders(authHeaders($stranger))
        ->getJson('/api/v1/boards/'.$board->id)
        ->assertOk();

    $this->withHeaders(authHeaders($stranger))
        ->postJson('/api/v1/tasks', [
            'column_id' => $column->id,
            'title' => 'Community task',
        ])->assertForbidden();
});

test('non-admin member cannot add or remove members', function () {
    $owner = User::factory()->create();
    $member = User::factory()->create();
    $other = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $owner->id]);
    $board->members()->attach($member->id, ['role' => 'member']);

    $this->withHeaders(authHeaders($member))
        ->postJson('/api/v1/boards/'.$board->id.'/members', ['email' => $other->email])
        ->assertForbidden();

    $this->withHeaders(authHeaders($member))
        ->deleteJson('/api/v1/boards/'.$board->id.'/members/'.$other->id)
        ->assertForbidden();
});
