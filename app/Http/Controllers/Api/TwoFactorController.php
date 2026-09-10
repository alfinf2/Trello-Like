<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ConfirmPasswordRequest;
use App\Http\Requests\Api\ConfirmTwoFactorRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Actions\ConfirmTwoFactorAuthentication;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;
use Laravel\Fortify\Fortify;

class TwoFactorController extends Controller
{
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => [
                'enabled' => $user->hasEnabledTwoFactorAuthentication(),
                'confirming' => ! is_null($user->two_factor_secret)
                    && is_null($user->two_factor_confirmed_at),
            ],
        ]);
    }

    public function enable(Request $request, EnableTwoFactorAuthentication $enable): JsonResponse
    {
        $user = $request->user();

        $enable($user, $request->boolean('force', false));

        $setupKey = Fortify::currentEncrypter()->decrypt($user->two_factor_secret);

        $qrSvg = $user->twoFactorQrCodeSvg();

        $codes = json_decode(
            Fortify::currentEncrypter()->decrypt($user->two_factor_recovery_codes),
            true,
        );

        return response()->json([
            'data' => [
                'setup_key' => $setupKey,
                'qr_svg' => $qrSvg,
                'recovery_codes' => $codes,
            ],
        ]);
    }

    public function confirm(ConfirmTwoFactorRequest $request, ConfirmTwoFactorAuthentication $confirm): JsonResponse
    {
        $confirm($request->user(), $request->string('code')->toString());

        return response()->json(['message' => __('Two factor authentication enabled.')]);
    }

    public function destroy(Request $request, DisableTwoFactorAuthentication $disable): JsonResponse
    {
        $disable($request->user());

        return response()->json(['message' => __('Two factor authentication disabled.')]);
    }

    public function recoveryCodes(Request $request): JsonResponse
    {
        $user = $request->user();

        if (is_null($user->two_factor_secret) || is_null($user->two_factor_recovery_codes)) {
            return response()->json(['data' => []]);
        }

        return response()->json([
            'data' => json_decode(
                Fortify::currentEncrypter()->decrypt($user->two_factor_recovery_codes),
                true,
            ),
        ]);
    }

    public function regenerateRecoveryCodes(Request $request, GenerateNewRecoveryCodes $generate): JsonResponse
    {
        $generate($request->user());

        $user = $request->user();

        return response()->json([
            'data' => json_decode(
                Fortify::currentEncrypter()->decrypt($user->two_factor_recovery_codes),
                true,
            ),
        ]);
    }

    public function confirmPassword(ConfirmPasswordRequest $request): JsonResponse
    {
        return response()->json(['message' => __('Password confirmed.')]);
    }
}
