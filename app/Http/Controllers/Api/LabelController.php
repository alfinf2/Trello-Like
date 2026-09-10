<?php

namespace App\Http\Controllers\Api;

use App\Actions\Label\CreateLabelAction;
use App\Actions\Label\DeleteLabelAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreLabelRequest;
use App\Http\Resources\LabelResource;
use App\Models\Board;
use App\Models\Label;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LabelController extends Controller
{
    public function index(Board $board): AnonymousResourceCollection
    {
        $this->authorize('view', $board);

        return LabelResource::collection($board->labels()->orderBy('name')->get());
    }

    public function store(StoreLabelRequest $request, Board $board): JsonResponse
    {
        $this->authorize('view', $board);

        $label = app(CreateLabelAction::class)->handle(
            $board,
            $request->validated('name'),
            $request->validated('color'),
        );

        return response()->json(['data' => new LabelResource($label)], 201);
    }

    public function destroy(Label $label): JsonResponse
    {
        $board = $label->loadMissing('board')->board;

        $this->authorize('view', $board);

        app(DeleteLabelAction::class)->handle($label);

        return response()->json(['message' => __('Label deleted.')]);
    }
}
