<?php

namespace App\Http\Controllers\Api;

use App\Actions\Label\AttachLabelsAction;
use App\Actions\Label\DetachLabelAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AttachLabelsRequest;
use App\Http\Resources\LabelResource;
use App\Models\Label;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TaskLabelController extends Controller
{
    public function index(Task $task): AnonymousResourceCollection
    {
        $this->authorize('manageLabels', $task);

        return LabelResource::collection($task->labels()->orderBy('name')->get());
    }

    public function store(AttachLabelsRequest $request, Task $task): AnonymousResourceCollection
    {
        $this->authorize('manageLabels', $task);

        app(AttachLabelsAction::class)->handle($task, $request->user(), $request->validated('label_ids'));

        return LabelResource::collection($task->labels()->orderBy('name')->get());
    }

    public function destroy(Request $request, Task $task, Label $label): JsonResponse
    {
        $this->authorize('manageLabels', $task);

        app(DetachLabelAction::class)->handle($task, $request->user(), $label->id);

        return response()->json(['message' => __('Label removed from task.')]);
    }
}
