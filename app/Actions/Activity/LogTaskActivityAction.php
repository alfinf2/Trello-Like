<?php

namespace App\Actions\Activity;

use App\Models\Task;
use App\Models\TaskActivity;
use App\Models\User;

class LogTaskActivityAction
{
    /** @param  array<string, mixed>|null  $oldValue
     * @param  array<string, mixed>|null  $newValue
     */
    public function handle(
        Task $task,
        User $user,
        string $type,
        ?array $oldValue = null,
        ?array $newValue = null,
    ): TaskActivity {
        return TaskActivity::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'type' => $type,
            'old_value' => $oldValue,
            'new_value' => $newValue,
        ]);
    }
}
