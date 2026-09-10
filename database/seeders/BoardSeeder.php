<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\Column;
use App\Models\Label;
use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BoardSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $user = User::where('email', 'test@example.com')->firstOrFail();

        $board = Board::factory()->create([
            'user_id' => $user->id,
            'name' => 'Product Launch',
            'description' => 'Planning board for the Q3 product release.',
            'position' => 1.0,
        ]);

        $columnNames = ['Backlog', 'To Do', 'In Progress', 'Done'];

        $columns = collect($columnNames)->map(
            fn (string $name, int $index): Column => Column::factory()->create([
                'board_id' => $board->id,
                'name' => $name,
                'position' => $index + 1.0,
            ]),
        );

        $labels = collect([
            ['Bug', '#EF4444'],
            ['Feature', '#3B82F6'],
            ['Design', '#A855F7'],
            ['Docs', '#10B981'],
        ])->map(
            fn (array $label): Label => Label::factory()->create([
                'board_id' => $board->id,
                'name' => $label[0],
                'color' => $label[1],
            ]),
        );

        $titlesByColumn = [
            1 => ['Finalize roadmap', 'Gather user feedback', 'Competitor analysis'],
            2 => ['Draft marketing copy', 'Define pricing tiers'],
            3 => ['Design landing page', 'Write API documentation'],
            4 => ['Scope mobile app', 'Set up CI pipeline'],
        ];

        collect($titlesByColumn)->each(function (array $titles, int $columnIndex) use ($columns, $labels, $user): void {
            $columnId = $columns[$columnIndex - 1]->id;

            foreach ($titles as $index => $title) {
                $priority = ['low', 'medium', 'high', 'urgent'][$index % 4];

                Task::factory()->create([
                    'column_id' => $columnId,
                    'creator_id' => $user->id,
                    'assignee_id' => $user->id,
                    'title' => $title,
                    'position' => $index + 1.0,
                    'priority' => $priority,
                ])->labels()->attach($labels->random(2)->pluck('id'));
            }
        });
    }
}
