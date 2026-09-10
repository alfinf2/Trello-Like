<?php

use App\Models\Board;
use App\Models\User;

function boardWithTasks(User $owner, int $taskCount = 1): array
{
    $board = Board::factory()->create(['user_id' => $owner->id]);
    $column = $board->columns()->create(['name' => 'Backlog', 'position' => 1]);

    for ($i = 1; $i <= $taskCount; $i++) {
        $column->tasks()->create([
            'creator_id' => $owner->id,
            'title' => "Task {$i}",
            'position' => $i,
        ]);
    }

    return [$board, $column];
}

test('member can create a task with labels', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $column = $board->columns()->create(['name' => 'Backlog', 'position' => 1]);
    $label = $board->labels()->create(['name' => 'bug', 'color' => '#ef4444']);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/tasks', [
            'column_id' => $column->id,
            'title' => 'Fix the bug',
            'priority' => 'high',
            'labels' => [$label->id],
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.title', 'Fix the bug')
        ->assertJsonPath('data.priority', 'high')
        ->assertJsonPath('data.position', 1)
        ->assertJsonPath('data.labels.0.id', $label->id);

    expect($column->tasks()->count())->toBe(1);
});

test('task cannot reference a label from another board', function () {
    $user = User::factory()->create();
    $boardA = Board::factory()->create(['user_id' => $user->id]);
    $boardB = Board::factory()->create(['user_id' => $user->id]);
    $column = $boardA->columns()->create(['name' => 'Backlog', 'position' => 1]);
    $foreignLabel = $boardB->labels()->create(['name' => 'foreign', 'color' => '#000000']);

    $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/tasks', [
            'column_id' => $column->id,
            'title' => 'Invalid label',
            'labels' => [$foreignLabel->id],
        ])->assertStatus(422)
        ->assertJsonValidationErrors(['labels']);
});

test('task creation validates input', function () {
    $user = User::factory()->create();

    $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/tasks', ['title' => ''])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['column_id', 'title']);
});

test('tasks are paginated with cursor', function () {
    $user = User::factory()->create();
    [, $column] = boardWithTasks($user, 5);

    $response = $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/columns/'.$column->id.'/tasks?per_page=3');

    $response->assertOk();
    expect(count($response->json('data')))->toBe(3);
    expect($response->json('meta.next_cursor'))->not->toBeNull();
});

test('owner can update a task and completion is tracked', function () {
    $user = User::factory()->create();
    [$board, $column] = boardWithTasks($user);

    $task = $column->tasks()->firstOrFail();

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/tasks/'.$task->id, ['is_completed' => true])
        ->assertOk()
        ->assertJsonPath('data.is_completed', true);

    $task->refresh();
    expect($task->completed_at)->not->toBeNull();
});

test('member can move a task between columns on the same board', function () {
    $user = User::factory()->create();
    [$board, $withdrawal] = boardWithTasks($user);
    $target = $board->columns()->create(['name' => 'Done', 'position' => 2]);
    $task = $withdrawal->tasks()->firstOrFail();

    $response = $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/tasks/'.$task->id.'/move', [
            'column_id' => $target->id,
            'position' => 1,
        ]);

    $response->assertOk()
        ->assertJsonPath('data.column_id', $target->id)
        ->assertJsonPath('data.position', 1);

    expect($target->tasks()->count())->toBe(1);
    expect($withdrawal->tasks()->count())->toBe(0);
});

test('move to a column on another board is rejected', function () {
    $user = User::factory()->create();
    $boardA = Board::factory()->create(['user_id' => $user->id, 'name' => 'A']);
    $boardB = Board::factory()->create(['user_id' => $user->id, 'name' => 'B']);
    $from = $boardA->columns()->create(['name' => 'Backlog', 'position' => 1]);
    $to = $boardB->columns()->create(['name' => 'Backlog', 'position' => 1]);
    $task = $from->tasks()->create([
        'creator_id' => $user->id,
        'title' => 'Movable',
        'position' => 1,
    ]);

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/tasks/'.$task->id.'/move', [
            'column_id' => $to->id,
            'position' => 1,
        ])->assertStatus(422)
        ->assertJsonValidationErrors(['column_id']);
});

test('moving a task shifts existing siblings down', function () {
    $user = User::factory()->create();
    [, $column] = boardWithTasks($user, 3);

    $first = $column->tasks()->orderBy('position')->firstOrFail();
    $third = $column->tasks()->reorder('position', 'desc')->firstOrFail();

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/tasks/'.$third->id.'/move', [
            'column_id' => $column->id,
            'position' => 1,
        ])->assertOk();

    $first->refresh();
    $third->refresh();

    expect((float) $third->position)->toBe(1.0);
    expect((float) $first->position)->toBe(2.0);
});

test('owner can delete a task (soft delete)', function () {
    $user = User::factory()->create();
    [, $column] = boardWithTasks($user);
    $task = $column->tasks()->firstOrFail();

    $this->withHeaders(authHeaders($user))
        ->deleteJson('/api/v1/tasks/'.$task->id)
        ->assertOk();

    $this->assertSoftDeleted('tasks', ['id' => $task->id]);
});

test('stranger cannot act on a task from a private board', function () {
    $owner = User::factory()->create();
    $stranger = User::factory()->create();
    [, $column] = boardWithTasks($owner);
    $task = $column->tasks()->firstOrFail();

    $this->withHeaders(authHeaders($stranger))
        ->getJson('/api/v1/tasks/'.$task->id)
        ->assertForbidden();

    $this->withHeaders(authHeaders($stranger))
        ->putJson('/api/v1/tasks/'.$task->id, ['title' => 'Hijack'])
        ->assertForbidden();
});
