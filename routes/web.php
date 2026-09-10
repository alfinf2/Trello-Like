<?php

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/app')->name('home');

Route::redirect('/dashboard', '/app')->name('dashboard');

Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    return redirect()->route('home');
})->middleware(['signed'])->name('verification.verify');

Route::get('/app/{any?}', fn () => view('spa'))->where('any', '.*')->name('app');
