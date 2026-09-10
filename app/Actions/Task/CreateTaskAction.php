<?php

namespace App\Actions\Task;

use App\Actions\Activity\LogTaskActivityAction;
use App\Models\Column;
use App\Models\Label;
use App\Models\Task;
use App\Models\User;
use App\Services\PositionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateTaskAction
{
    public function __construct(
        private readonly PositionService $positions,
        private readonly LogTaskActivityAction $logger,
    ) {}

    /** @param  array<string, mixed>  $data */
    public function handle(User $creator, array $data): Task
    {
        $column = Column::findOrFail((int) $data['column_id']);

        $position = $this->positions->next(Task::where('column_id', $column->id));
        $labels = $data['labels'] ?? [];

        if ($labels !== []) {
            $labelCount = Label::query()
                ->whereIn('id', $labels)
                ->where('board_id', $column->board_id)
                ->count();

            if ($labelCount !== count($labels)) {
                throw ValidationException::withMessages([
                    'labels' => __('One or more labels do not belong to this board.'),
                ]);
            }
        }

        return DB::transaction(function () use ($creator, $column, $data, $position, $labels): Task {
            $task = Task::create([
                'column_id' => $column->id,
                'creator_id' => $creator->id,
                'assignee_id' => $data['assignee_id'] ?? null,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'position' => $position,
                'priority' => $data['priority'] ?? 'medium',
                'due_date' => $data['due_date'] ?? null,
            ]);

            if ($labels !== []) {
                $task->labels()->attach($labels);
            }

            $this->logger->handle($task, $creator, 'created', null, ['title' => $task->title]);

            return $task;
        });
    }
}
