<?php

use App\Models\Board;
use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\User;

function freshTask(): array
{
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $column = $board->columns()->create(['name' => 'Backlog', 'position' => 1]);
    $task = $column->tasks()->create([
        'creator_id' => $user->id,
        'title' => 'Track me',
        'position' => 1,
    ]);

    return [$user, $task];
}

test('creating, updating, moving and deleting a task logs activity', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $column = $board->columns()->create(['name' => 'Backlog', 'position' => 1]);
    $target = $board->columns()->create(['name' => 'Done', 'position' => 2]);

    $response = $this->withHeaders(authHeaders($user))
        ->postJson('/api/v1/tasks', ['column_id' => $column->id, 'title' => 'Track me'])
        ->assertCreated();

    $task = Task::findOrFail($response->json('data.id'));

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/tasks/'.$task->id, ['title' => 'Renamed'])
        ->assertOk();

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/tasks/'.$task->id.'/move', [
            'column_id' => $target->id,
            'position' => 1,
        ])->assertOk();

    $this->withHeaders(authHeaders($user))
        ->deleteJson('/api/v1/tasks/'.$task->id)
        ->assertOk();

    $types = TaskActivity::where('task_id', $task->id)->orderBy('id')->pluck('type')->all();

    expect($types)->toBe(['created', 'updated', 'moved', 'deleted']);

    $moved = TaskActivity::where('task_id', $task->id)->where('type', 'moved')->firstOrFail();
    expect($moved->old_value)->toMatchArray(['column_id' => $column->id]);
    expect($moved->new_value['column_id'])->toBe($target->id);
});

test('activity history is exposed on a task', function () {
    [$user, $task] = freshTask();

    $this->withHeaders(authHeaders($user))
        ->putJson('/api/v1/tasks/'.$task->id, ['title' => 'Changed'])
        ->assertOk();

    $this->withHeaders(authHeaders($user))
        ->getJson('/api/v1/tasks/'.$task->id.'/activities')
        ->assertOk()
        ->assertJsonPath('data.0.type', 'updated');
});

test('stranger cannot read activity history', function () {
    [$owner, $task] = freshTask();
    $stranger = User::factory()->create();

    $this->withHeaders(authHeaders($stranger))
        ->getJson('/api/v1/tasks/'.$task->id.'/activities')
        ->assertForbidden();
});
