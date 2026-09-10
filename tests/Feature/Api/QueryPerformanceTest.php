<?php

use App\Models\Board;
use App\Models\User;
use Illuminate\Support\Facades\DB;

function queryCountFor(callable $callback): int
{
    DB::flushQueryLog();
    DB::enableQueryLog();

    $callback();

    return count(DB::getQueryLog());
}

test('board detail query count stays constant as tasks grow', function () {
    $user = User::factory()->create();
    $headers = authHeaders($user);

    $small = Board::factory()->create(['user_id' => $user->id]);
    $smallColumn = $small->columns()->create(['name' => 'Backlog', 'position' => 1]);
    for ($i = 1; $i <= 3; $i++) {
        $smallColumn->tasks()->create([
            'creator_id' => $user->id,
            'title' => 'Small task '.$i,
            'position' => $i,
        ]);
    }

    $large = Board::factory()->create(['user_id' => $user->id]);
    $largeColumn = $large->columns()->create(['name' => 'Backlog', 'position' => 1]);
    for ($i = 1; $i <= 30; $i++) {
        $largeColumn->tasks()->create([
            'creator_id' => $user->id,
            'title' => 'Large task '.$i,
            'position' => $i,
        ]);
    }

    $this->withHeaders($headers)->getJson('/api/v1/me')->assertOk();

    $smallCount = queryCountFor(function () use ($headers, $small): void {
        $this->withHeaders($headers)->getJson('/api/v1/boards/'.$small->id)->assertOk();
    });

    $largeCount = queryCountFor(function () use ($headers, $large): void {
        $this->withHeaders($headers)->getJson('/api/v1/boards/'.$large->id)->assertOk();
    });

    expect(abs($largeCount - $smallCount))->toBeLessThanOrEqual(2);
    expect($largeCount)->toBeLessThan(15);
});

test('board list does not trigger N+1 queries', function () {
    $user = User::factory()->create();

    for ($i = 0; $i < 10; $i++) {
        $board = Board::factory()->create(['user_id' => $user->id]);
        $board->columns()->create(['name' => 'Backlog', 'position' => 1]);
    }

    $this->withHeaders(authHeaders($user))->getJson('/api/v1/me')->assertOk();

    $count = queryCountFor(function () use ($user): void {
        $this->withHeaders(authHeaders($user))
            ->getJson('/api/v1/boards?per_page=20')
            ->assertOk()
            ->assertJsonCount(10, 'data');
    });

    expect($count)->toBeLessThan(15);
});

test('column tasks list query count is bounded', function () {
    $user = User::factory()->create();
    $board = Board::factory()->create(['user_id' => $user->id]);
    $column = $board->columns()->create(['name' => 'Backlog', 'position' => 1]);

    for ($i = 1; $i <= 50; $i++) {
        $column->tasks()->create([
            'creator_id' => $user->id,
            'title' => 'Task '.$i,
            'position' => $i,
        ]);
    }

    $this->withHeaders(authHeaders($user))->getJson('/api/v1/me')->assertOk();

    $count = queryCountFor(function () use ($user, $column): void {
        $this->withHeaders(authHeaders($user))
            ->getJson('/api/v1/columns/'.$column->id.'/tasks?per_page=25')
            ->assertOk();
    });

    expect($count)->toBeLessThan(10);
});
