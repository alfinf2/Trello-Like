<?php

namespace App\Actions\Task;

use App\Actions\Activity\LogTaskActivityAction;
use App\Models\Task;
use App\Models\User;

class DeleteTaskAction
{
    public function __construct(private readonly LogTaskActivityAction $logger) {}

    public function handle(Task $task, User $user): void
    {
        $this->logger->handle($task, $user, 'deleted', [
            'title' => $task->title,
            'column_id' => $task->column_id,
        ]);

        $task->delete();
    }
}
