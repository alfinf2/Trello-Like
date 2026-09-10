<?php

use App\Http\Controllers\Api\ActivityController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\BoardMemberController;
use App\Http\Controllers\Api\ColumnController;
use App\Http\Controllers\Api\LabelController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TaskLabelController;
use App\Http\Controllers\Api\TwoFactorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function (): void {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:5,1');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::post('forgot-password', [PasswordResetController::class, 'store'])->middleware('throttle:5,1');
    Route::post('reset-password', [PasswordResetController::class, 'update'])->middleware('throttle:6,1');
    Route::post('two-factor/login', [AuthController::class, 'twoFactorLogin'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('logout', [AuthController::class, 'logout'])->middleware('throttle:10,1');
        Route::get('me', [AuthController::class, 'me']);
        Route::put('profile', [ProfileController::class, 'update']);
        Route::put('profile/password', [ProfileController::class, 'updatePassword']);
        Route::delete('profile', [ProfileController::class, 'destroy']);

        Route::prefix('two-factor')->group(function (): void {
            Route::get('/', [TwoFactorController::class, 'status']);
            Route::post('/', [TwoFactorController::class, 'enable'])->middleware('throttle:5,1');
            Route::put('/', [TwoFactorController::class, 'confirm'])->middleware('throttle:5,1');
            Route::delete('/', [TwoFactorController::class, 'destroy'])->middleware('throttle:5,1');
            Route::get('recovery-codes', [TwoFactorController::class, 'recoveryCodes']);
            Route::put('recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes'])->middleware('throttle:5,1');
        });

        Route::post('email/verification-notification', function (Request $request) {
            $request->user()->sendEmailVerificationNotification();

            return response()->json(['message' => 'Verification link sent.']);
        })->middleware('throttle:6,1');

        Route::get('boards', [BoardController::class, 'index']);
        Route::post('boards', [BoardController::class, 'store']);
        Route::get('boards/{board}', [BoardController::class, 'show']);
        Route::put('boards/{board}', [BoardController::class, 'update']);
        Route::delete('boards/{board}', [BoardController::class, 'destroy']);

        Route::post('boards/{board}/members', [BoardMemberController::class, 'store']);
        Route::delete('boards/{board}/members/{user}', [BoardMemberController::class, 'destroy']);

        Route::get('boards/{board}/columns', [ColumnController::class, 'index']);
        Route::post('boards/{board}/columns', [ColumnController::class, 'store']);
        Route::put('boards/{board}/columns/reorder', [ColumnController::class, 'reorder']);
        Route::put('columns/{column}', [ColumnController::class, 'update']);
        Route::delete('columns/{column}', [ColumnController::class, 'destroy']);

        Route::get('columns/{column}/tasks', [TaskController::class, 'index']);
        Route::post('tasks', [TaskController::class, 'store']);
        Route::get('tasks/{task}', [TaskController::class, 'show']);
        Route::put('tasks/{task}', [TaskController::class, 'update']);
        Route::put('tasks/{task}/move', [TaskController::class, 'move']);
        Route::delete('tasks/{task}', [TaskController::class, 'destroy']);

        Route::get('boards/{board}/labels', [LabelController::class, 'index']);
        Route::post('boards/{board}/labels', [LabelController::class, 'store']);
        Route::delete('labels/{label}', [LabelController::class, 'destroy']);

        Route::get('tasks/{task}/labels', [TaskLabelController::class, 'index']);
        Route::post('tasks/{task}/labels', [TaskLabelController::class, 'store']);
        Route::delete('tasks/{task}/labels/{label}', [TaskLabelController::class, 'destroy']);

        Route::get('tasks/{task}/activities', [ActivityController::class, 'index']);
    });
});
