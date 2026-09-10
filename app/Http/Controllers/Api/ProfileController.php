<?php

namespace App\Http\Controllers\Api;

use App\Actions\Profile\DeleteAccountAction;
use App\Actions\Profile\UpdatePasswordAction;
use App\Actions\Profile\UpdateProfileAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\DeleteAccountRequest;
use App\Http\Requests\Api\UpdatePasswordRequest;
use App\Http\Requests\Api\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = app(UpdateProfileAction::class)->handle($request->user(), $request->validated());

        return response()->json(['data' => new UserResource($user)]);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        app(UpdatePasswordAction::class)->handle($request->user(), $request->validated('password'));

        return response()->json(['message' => __('Password updated.')]);
    }

    public function destroy(DeleteAccountRequest $request): JsonResponse
    {
        app(DeleteAccountAction::class)->handle($request->user());

        return response()->json(['message' => __('Account deleted.')]);
    }
}
