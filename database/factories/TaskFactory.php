<?php

namespace Database\Factories;

use App\Models\Column;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'column_id' => Column::factory(),
            'creator_id' => User::factory(),
            'assignee_id' => null,
            'title' => fake()->sentence(3),
            'description' => fake()->optional(0.7)->paragraph(),
            'position' => 1.0,
            'priority' => fake()->randomElement(['low', 'medium', 'high', 'urgent']),
            'due_date' => fake()->randomElement([null, fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d')]),
            'is_completed' => false,
            'completed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state([
            'is_completed' => true,
            'completed_at' => Carbon::now()->subHour(),
        ]);
    }
}
