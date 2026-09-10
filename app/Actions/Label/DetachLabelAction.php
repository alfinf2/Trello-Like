<?php

namespace App\Actions\Label;

use App\Actions\Activity\LogTaskActivityAction;
use App\Models\Label;
use App\Models\Task;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class DetachLabelAction
{
    public function __construct(private readonly LogTaskActivityAction $logger) {}

    public function handle(Task $task, User $user, int $labelId): void
    {
        $task->loadMissing('column');

        $label = Label::where('id', $labelId)->firstOrFail();

        if ($label->board_id !== $task->column->board_id) {
            throw ValidationException::withMessages([
                'label_id' => __('Label does not belong to this board.'),
            ]);
        }

        $task->labels()->detach($labelId);

        $this->logger->handle($task, $user, 'label_detached', null, [
            'label_id' => $labelId,
        ]);
    }
}
