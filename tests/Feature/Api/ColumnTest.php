<?php

use App\Models\Board;
use App\Models\User;

test('member can list columns', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $board->columns()->create(['name' => 'To Do', 'position' => 1]);
    $board->columns()->create(['name' => 'Done', 'position' => 2]);

    $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/boards/'.$board->id.'/columns')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'To Do')
        ->assertJsonCount(2, 'data');
});

test('column is appended at the end of the board', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $board->columns()->create(['name' => 'Backlog', 'position' => 1]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/boards/'.$board->id.'/columns', ['name' => 'Archive']);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Archive')
        ->assertJsonPath('data.position', 2);
});

test('owner can rename a column', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $column = $board->columns()->create(['name' => 'Old', 'position' => 1]);

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/columns/'.$column->id, ['name' => 'New'])
        ->assertOk()
        ->assertJsonPath('data.name', 'New');
});

test('owner can reorder columns', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $first = $board->columns()->create(['name' => 'A', 'position' => 1]);
    $second = $board->columns()->create(['name' => 'B', 'position' => 2]);
    $third = $board->columns()->create(['name' => 'C', 'position' => 3]);

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/boards/'.$board->id.'/columns/reorder', [
            'columns' => [
                ['id' => $third->id, 'position' => 1],
                ['id' => $first->id, 'position' => 2],
                ['id' => $second->id, 'position' => 3],
            ],
        ])->assertOk();

    $this->assertDatabaseHas('columns', ['id' => $third->id, 'position' => 1]);
    $this->assertDatabaseHas('columns', ['id' => $first->id, 'position' => 2]);
    $this->assertDatabaseHas('columns', ['id' => $second->id, 'position' => 3]);
});

test('deleting a column removes its tasks', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $column = $board->columns()->create(['name' => 'Doomed', 'position' => 1]);
    $task = $column->tasks()->create([
        'creator_id' => $user->id,
        'title' => 'Expired',
        'position' => 1,
    ]);

    $this->withHeaders(authHeaders($user))
        ->deleteJson('/api/v1/columns/'.$column->id)
        ->assertOk();

    expect($column->tasks()->withTrashed()->find($task->id))->toBeNull();
});

test('stranger cannot view columns unless the board is public', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    $board = Board::factory()->create([
        'user_id' => $owner->id,
        'visibility' => 'private',
    ]);

    $this->withHeaders(authHeaders($stranger))
        ->getJson('/api/v1/boards/'.$board->id.'/columns')
        ->assertForbidden();
});

test('column reorder validates payload', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/boards/'.$board->id.'/columns/reorder', [
            'columns' => [],
        ])->assertStatus(422)
        ->assertJsonValidationErrors(['columns']);
});
