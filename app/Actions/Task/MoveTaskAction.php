<?php

namespace App\Actions\Task;

use App\Actions\Activity\LogTaskActivityAction;
use App\Models\Column;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MoveTaskAction
{
    public function __construct(private readonly LogTaskActivityAction $logger) {}

    public function handle(Task $task, User $user, int $columnId, float $position): Task
    {
        $targetColumn = Column::findOrFail($columnId);

        if ($targetColumn->board_id !== $task->column()->value('board_id')) {
            throw ValidationException::withMessages([
                'column_id' => __('Tasks can only be moved between columns on the same board.'),
            ]);
        }

        $old = [
            'column_id' => $task->column_id,
            'position' => (float) $task->position,
        ];

        DB::transaction(function () use ($task, $targetColumn, $position, $user, $old): void {
            $this->shiftSiblings($targetColumn->id, $position, $task->id);

            $task->forceFill([
                'column_id' => $targetColumn->id,
                'position' => (string) $position,
            ])->save();

            $this->logger->handle($task, $user, 'moved', $old, [
                'column_id' => $targetColumn->id,
                'position' => $position,
            ]);
        });

        return $task->refresh();
    }

    private function shiftSiblings(int $columnId, float $position, int $excludingTaskId): void
    {
        Task::query()
            ->where('column_id', $columnId)
            ->whereKeyNot($excludingTaskId)
            ->where('position', '>=', $position)
            ->orderByDesc('position')
            ->get()
            ->each(function (Task $sibling): void {
                $sibling->position = (string) min((float) $sibling->position + 1.0, 99999999.0);
                $sibling->save();
            });
    }
}
