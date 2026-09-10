<?php

namespace App\Http\Controllers\Api;

use App\Actions\Board\CreateBoardAction;
use App\Actions\Board\DeleteBoardAction;
use App\Actions\Board\UpdateBoardAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreBoardRequest;
use App\Http\Requests\Api\UpdateBoardRequest;
use App\Http\Resources\BoardDetailResource;
use App\Http\Resources\BoardResource;
use App\Models\Board;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class BoardController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $boards = Board::query()
            ->withCount(['members', 'tasks'])
            ->with(['owner' => fn ($query) => $query->select('id', 'name', 'email')])
            ->where(function ($query) use ($user): void {
                $query->where('user_id', $user->id)
                    ->orWhereHas('members', fn ($member) => $member->whereKey($user->id));
            })
            ->orderBy('position')
            ->cursorPaginate($request->integer('per_page', 20));

        return BoardResource::collection($boards);
    }

    public function store(StoreBoardRequest $request): JsonResponse
    {
        $this->authorize('create', Board::class);

        $board = app(CreateBoardAction::class)->handle(
            $request->user(),
            $request->validated('name'),
            $request->validated('description'),
            $request->validated('visibility', 'private'),
        );

        $board->load(['owner' => fn ($query) => $query->select('id', 'name', 'email')]);

        return response()->json(['data' => new BoardResource($board)], 201);
    }

    public function show(Board $board): JsonResponse
    {
        $this->authorize('view', $board);

        $board->load([
            'owner' => fn ($query) => $query->select('id', 'name', 'email'),
            'members' => fn ($query) => $query->select('users.id', 'users.name', 'users.email')->orderBy('name'),
            'labels' => fn ($query) => $query->orderBy('name'),
            'columns' => fn ($query) => $query->orderBy('position')->with([
                'tasks' => fn ($tasks) => $tasks->orderBy('position')->limit(500)->with([
                    'labels',
                    'assignee:id,name,email',
                    'creator:id,name,email',
                ]),
            ]),
        ]);

        return response()->json(['data' => new BoardDetailResource($board)]);
    }

    public function update(UpdateBoardRequest $request, Board $board): JsonResponse
    {
        $this->authorize('update', $board);

        $board = app(UpdateBoardAction::class)->handle($board, $request->validated());

        $board->load(['owner' => fn ($query) => $query->select('id', 'name', 'email')]);

        return response()->json(['data' => new BoardResource($board)]);
    }

    public function destroy(Board $board): JsonResponse
    {
        $this->authorize('delete', $board);

        app(DeleteBoardAction::class)->handle($board);

        return response()->json(['message' => __('Board deleted.')]);
    }
}
