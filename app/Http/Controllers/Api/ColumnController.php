<?php

namespace App\Http\Controllers\Api;

use App\Actions\Column\CreateColumnAction;
use App\Actions\Column\DeleteColumnAction;
use App\Actions\Column\ReorderColumnsAction;
use App\Actions\Column\UpdateColumnAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ReorderColumnsRequest;
use App\Http\Requests\Api\StoreColumnRequest;
use App\Http\Requests\Api\UpdateColumnRequest;
use App\Http\Resources\ColumnResource;
use App\Models\Board;
use App\Models\Column;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ColumnController extends Controller
{
    public function index(Board $board): AnonymousResourceCollection
    {
        $this->authorize('view', $board);

        $columns = $board->columns()->orderBy('position')->get();

        return ColumnResource::collection($columns);
    }

    public function store(StoreColumnRequest $request, Board $board): JsonResponse
    {
        $this->authorize('create', [Column::class, $board]);

        $column = app(CreateColumnAction::class)->handle(
            $board,
            $request->validated('name'),
        );

        return response()->json(['data' => new ColumnResource($column)], 201);
    }

    public function update(UpdateColumnRequest $request, Column $column): JsonResponse
    {
        $this->authorize('update', $column);

        $column = app(UpdateColumnAction::class)->handle($column, $request->validated('name'));

        return response()->json(['data' => new ColumnResource($column)]);
    }

    public function destroy(Column $column): JsonResponse
    {
        $this->authorize('delete', $column);

        app(DeleteColumnAction::class)->handle($column);

        return response()->json(['message' => __('Column deleted.')]);
    }

    public function reorder(ReorderColumnsRequest $request, Board $board): JsonResponse
    {
        $this->authorize('reorder', [Column::class, $board]);

        app(ReorderColumnsAction::class)->handle($board, $request->validated('columns'));

        return response()->json(['message' => __('Columns reordered.')]);
    }
}
