<?php

namespace App\Actions\Task;

use App\Actions\Activity\LogTaskActivityAction;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class UpdateTaskAction
{
    public function __construct(private readonly LogTaskActivityAction $logger) {}

    /** @param  array<string, mixed>  $data */
    public function handle(Task $task, User $user, array $data): Task
    {
        $old = array_intersect_key($task->getAttributes(), array_flip(array_keys($data)));

        DB::transaction(function () use ($task, $user, $data, $old): void {
            $task->update($data);

            if (array_key_exists('is_completed', $data)) {
                $task->completed_at = $task->is_completed ? Carbon::instance(now()) : null;
                $task->save();
            }

            $this->logger->handle(
                $task,
                $user,
                'updated',
                $old,
                $task->refresh()->only(array_keys($data)),
            );
        });

        return $task->refresh();
    }
}
