<?php

namespace App\Http\Controllers\Api;

use App\Actions\Task\CreateTaskAction;
use App\Actions\Task\DeleteTaskAction;
use App\Actions\Task\MoveTaskAction;
use App\Actions\Task\UpdateTaskAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\MoveTaskRequest;
use App\Http\Requests\Api\StoreTaskRequest;
use App\Http\Requests\Api\UpdateTaskRequest;
use App\Http\Resources\TaskDetailResource;
use App\Http\Resources\TaskResource;
use App\Models\Column;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TaskController extends Controller
{
    public function index(Request $request, Column $column): AnonymousResourceCollection
    {
        $this->authorize('view', $column);

        $tasks = $column->tasks()
            ->with(['labels', 'assignee:id,name,email', 'creator:id,name,email'])
            ->orderBy('position')
            ->cursorPaginate($request->integer('per_page', 25));

        return TaskResource::collection($tasks);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        $column = Column::query()->whereKey($request->validated('column_id'))->firstOrFail();

        $this->authorize('create', [Task::class, $column->board]);

        $task = app(CreateTaskAction::class)->handle($request->user(), $request->validated());

        $task->load([
            'labels',
            'assignee:id,name,email',
            'creator:id,name,email',
            'column:id,board_id',
        ]);

        return response()->json(['data' => new TaskResource($task)], 201);
    }

    public function show(Task $task): JsonResponse
    {
        $this->authorize('view', $task);

        $task->load([
            'labels',
            'assignee:id,name,email',
            'creator:id,name,email',
            'column:id,board_id',
            'activities.user:id,name,email',
        ]);

        return response()->json(['data' => new TaskDetailResource($task)]);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('update', $task);

        $task = app(UpdateTaskAction::class)->handle($task, $request->user(), $request->validated());

        $task->load([
            'labels',
            'assignee:id,name,email',
            'creator:id,name,email',
            'column:id,board_id',
        ]);

        return response()->json(['data' => new TaskResource($task)]);
    }

    public function move(MoveTaskRequest $request, Task $task): JsonResponse
    {
        $this->authorize('move', $task);

        $task = app(MoveTaskAction::class)->handle(
            $task,
            $request->user(),
            $request->validated('column_id'),
            (float) $request->validated('position'),
        );

        $task->load([
            'labels',
            'assignee:id,name,email',
            'creator:id,name,email',
            'column:id,board_id',
        ]);

        return response()->json(['data' => new TaskResource($task)]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorize('delete', $task);

        app(DeleteTaskAction::class)->handle($task, $request->user());

        return response()->json(['message' => __('Task deleted.')]);
    }
}
