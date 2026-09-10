<?php

use App\Models\Board;
use App\Models\Label;
use App\Models\User;

test('member can list and create labels', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $board->labels()->create(['name' => 'dev', 'color' => '#22c55e']);

    $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/boards/'.$board->id.'/labels')
        ->assertOk()
        ->assertJsonCount(1, 'data');

    $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/boards/'.$board->id.'/labels', [
            'name' => 'bug',
            'color' => '#ef4444',
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'bug');
});

test('label creation validates color', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);

    $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/boards/'.$board->id.'/labels', [
            'name' => 'bad',
            'color' => 'not-a-color',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['color']);
});

test('owner can delete a label', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $label = $board->labels()->create(['name' => 'gone', 'color' => '#000000']);

    $this->withHeaders(authHeaders($user))
        ->deleteJson('/api/v1/labels/'.$label->id)
        ->assertOk();

    expect(Label::find($label->id))->toBeNull();
});

test('member can attach and detach labels on a task', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $column = $board->columns()->create(['name' => 'Backlog', 'position' => 1]);
    $task = $column->tasks()->create([
        'creator_id' => $user->id,
        'title' => 'Tagged',
        'position' => 1,
    ]);
    $label = $board->labels()->create(['name' => 'bug', 'color' => '#ef4444']);

    $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/tasks/'.$task->id.'/labels', ['label_ids' => [$label->id]])
        ->assertOk()
        ->assertJsonCount(1, 'data');

    expect($task->labels()->count())->toBe(1);

    $this->withHeaders(authHeaders($user))
        ->deleteJson('/api/v1/tasks/'.$task->id.'/labels/'.$label->id)
        ->assertOk();

    expect($task->labels()->count())->toBe(0);
});

test('attaching a label from another board is rejected', function () {
    $user = User::factory()->create();
    $boardA = Board::factory()->create(['user_id' => $user->id]);
    $boardB = Board::factory()->create(['user_id' => $user->id]);
    $column = $boardA->columns()->create(['name' => 'Backlog', 'position' => 1]);
    $task = $column->tasks()->create([
        'creator_id' => $user->id,
        'title' => 'Tagged',
        'position' => 1,
    ]);
    $foreign = $boardB->labels()->create(['name' => 'elsewhere', 'color' => '#000000']);

    $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/tasks/'.$task->id.'/labels', ['label_ids' => [$foreign->id]])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['label_ids']);

    expect($task->labels()->count())->toBe(0);
});
