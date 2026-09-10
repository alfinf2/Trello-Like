<?php

namespace Database\Factories;

use App\Models\Board;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Board>
 */
class BoardFactory extends Factory
{
    protected $model = Board::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->company(),
            'description' => fake()->optional(0.7)->sentence(8),
            'visibility' => 'private',
            'position' => 1.0,
        ];
    }

    public function publicBoard(): static
    {
        return $this->state(['visibility' => 'public']);
    }

    public function withMembers(int $count = 3): static
    {
        return $this->afterCreating(function (Board $board) use ($count): void {
            $board->members()->attach(
                User::factory()->count($count)->create()->pluck('id'),
                ['role' => 'member'],
            );
        });
    }
}
