<?php

namespace Database\Factories;

use App\Models\Board;
use App\Models\Label;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Label>
 */
class LabelFactory extends Factory
{
    protected $model = Label::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'board_id' => Board::factory(),
            'name' => fake()->unique()->words(2, true),
            'color' => fake()->hexColor(),
        ];
    }
}
