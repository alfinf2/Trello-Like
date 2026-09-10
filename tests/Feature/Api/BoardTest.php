<?php

use App\Models\Board;
use App\Models\User;

test('owner can create a board with default columns', function () {
    $user = User::factory()->create();

    $response = $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/boards', [
            'name' => 'Product Launch',
            'description' => 'Ship v2.',
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.name', 'Product Launch')
        ->assertJsonPath('data.owner.id', $user->id);

    $board = Board::firstOrFail();
    expect($board->name)->toBe('Product Launch');
    expect($board->columns()->pluck('name')->all())
        ->toBe(['To Do', 'In Progress', 'Done']);
});

test('board creation validates input', function () {
    $user = User::factory()->create();

    $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/boards', ['visibility' => 'invalid'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'visibility']);
});

test('index lists only boards the user owns or has joined', function () {
    $user = User::factory()->create();
    $member = User::factory()->create();
    $stranger = User::factory()->create();
    $other = User::factory()->create();

    Board::factory()->create(['user_id' => $user->id, 'name' => 'Mine']);
    $shared = Board::factory()->create(['user_id' => $other->id, 'name' => 'Shared']);
    $shared->members()->attach($member->id, ['role' => 'member']);
    $public = Board::factory()->create([
        'user_id' => $stranger->id,
        'name' => 'Public One',
        'visibility' => 'public',
    ]);
    Board::factory()->create(['user_id' => $stranger->id, 'name' => 'Private One']);

    $response = $this->withHeaders(authHeaders($member))
        ->getJson('/api/v1/boards?per_page=20');

    $response->assertOk();
    $names = collect($response->json('data'))->pluck('name')->all();

    expect($names)->toContain('Shared')->not->toContain('Mine');
    expect($names)->not->toContain('Public One')->not->toContain('Private One');
});

test('show returns the full board detail', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $column = $board->columns()->create(['name' => 'Backlog', 'position' => 1]);
    $task = $column->tasks()->create([
        'creator_id' => $user->id,
        'title' => 'Write tests',
        'position' => 1,
    ]);
    $label = $board->labels()->create(['name' => 'bug', 'color' => '#ef4444']);
    $task->labels()->attach($label);

    $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/boards/'.$board->id)
        ->assertOk()
        ->assertJsonPath('data.id', $board->id)
        ->assertJsonPath('data.columns.0.name', 'Backlog')
        ->assertJsonPath('data.columns.0.tasks.0.title', 'Write tests')
        ->assertJsonPath('data.labels.0.name', 'bug');
});

test('owner can update a board', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/boards/'.$board->id, ['name' => 'Renamed'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Renamed');
});

test('owner can delete a board and its children are removed', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $column = $board->columns()->create(['name' => 'To Do', 'position' => 1]);
    $column->tasks()->create([
        'creator_id' => $user->id,
        'title' => 'Doomed',
        'position' => 1,
    ]);

    $this->withHeaders(authHeaders($user))
        ->deleteJson('/api/v1/boards/'.$board->id)
        ->assertOk();

    expect(Board::withTrashed()->find($board->id))->not->toBeNull();
    expect($column->tasks()->count())->toBe(0);
});

test('not found board returns 404', function () {
    $user = User::factory()->create();

    $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/boards/999999')
        ->assertNotFound();
});
