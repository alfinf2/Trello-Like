<?php

namespace App\Http\Controllers\Api;

use App\Actions\Board\AddBoardMemberAction;
use App\Actions\Board\RemoveBoardMemberAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\AddBoardMemberRequest;
use App\Http\Resources\BoardMemberResource;
use App\Models\Board;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class BoardMemberController extends Controller
{
    public function store(AddBoardMemberRequest $request, Board $board): JsonResponse
    {
        $this->authorize('manageMembers', $board);

        $member = app(AddBoardMemberAction::class)->handle(
            $board,
            $request->validated('email'),
            $request->validated('role', 'member'),
        );

        $member = $board->members()->whereKey($member->id)->first() ?? $member;

        return response()->json([
            'data' => new BoardMemberResource($member),
        ], 201);
    }

    public function destroy(Board $board, User $user): JsonResponse
    {
        $this->authorize('manageMembers', $board);

        if ($board->isOwner($user->id)) {
            return response()->json([
                'message' => __('The board owner cannot be removed.'),
            ], 422);
        }

        app(RemoveBoardMemberAction::class)->handle($board, $user->id);

        return response()->json(['message' => __('Member removed.')]);
    }
}
