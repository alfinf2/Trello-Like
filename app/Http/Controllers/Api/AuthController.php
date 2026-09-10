<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\LoginRequest;
use App\Http\Requests\Api\RegisterRequest;
use App\Http\Requests\Api\TwoFactorLoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Fortify;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        $token = $user->createToken(
            $request->device_name ?? 'default',
            ['*'],
            now()->addMinutes((int) config('sanctum.expiration')),
        )->plainTextToken;

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->validated('email'))->first();

        if ($user === null || ! Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('The provided credentials are incorrect.'),
            ]);
        }

        if ($user->hasEnabledTwoFactorAuthentication()) {
            $challenge = Str::random(40);

            Cache::put('two_factor_challenge:'.$challenge, $user->id, now()->addMinutes(5));

            return response()->json([
                'data' => [
                    'two_factor' => true,
                    'challenge' => $challenge,
                    'email' => $user->email,
                ],
            ]);
        }

        $token = $user->createToken(
            $request->validated('device_name', 'default'),
            ['*'],
            now()->addMinutes((int) config('sanctum.expiration')),
        )->plainTextToken;

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    public function twoFactorLogin(TwoFactorLoginRequest $request): JsonResponse
    {
        $userId = Cache::pull('two_factor_challenge:'.$request->validated('challenge'));

        if ($userId === null) {
            throw ValidationException::withMessages([
                'code' => __('Invalid or expired challenge.'),
            ]);
        }

        $user = User::query()->whereKey($userId)->first();

        if ($user === null) {
            throw ValidationException::withMessages([
                'code' => __('Invalid or expired challenge.'),
            ]);
        }

        $google2fa = app(Google2FA::class);

        $secret = Fortify::currentEncrypter()->decrypt($user->two_factor_secret);

        if (! $google2fa->verifyKey($secret, $request->validated('code'), (int) config('two_factor_auth_code_window', 1))) {
            throw ValidationException::withMessages([
                'code' => __('The provided code is invalid.'),
            ]);
        }

        $token = $user->createToken(
            'web',
            ['*'],
            now()->addMinutes((int) config('sanctum.expiration')),
        )->plainTextToken;

        return response()->json([
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => __('Logged out.')]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()),
        ]);
    }
}
