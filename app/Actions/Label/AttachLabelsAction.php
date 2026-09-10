<?php

namespace App\Actions\Label;

use App\Actions\Activity\LogTaskActivityAction;
use App\Models\Label;
use App\Models\Task;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class AttachLabelsAction
{
    public function __construct(private readonly LogTaskActivityAction $logger) {}

    /** @param  array<int>  $labelIds */
    public function handle(Task $task, User $user, array $labelIds): void
    {
        $task->loadMissing('column');

        $labels = Label::whereIn('id', $labelIds)->get();

        if ($labels->count() !== count($labelIds)) {
            throw ValidationException::withMessages([
                'label_ids' => __('One or more labels do not exist.'),
            ]);
        }

        if ($labels->contains(fn (Label $label) => $label->board_id !== $task->column->board_id)) {
            throw ValidationException::withMessages([
                'label_ids' => __('Labels must belong to the same board as the task.'),
            ]);
        }

        $attached = $task->labels()->syncWithoutDetaching($labelIds);

        $this->logger->handle($task, $user, 'labels_attached', null, [
            'label_ids' => array_keys($attached['attached']),
        ]);
    }
}
