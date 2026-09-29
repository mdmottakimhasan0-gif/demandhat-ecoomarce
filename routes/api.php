<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WebhookController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// === STEADFAST WEBHOOK ROUTE ===
Route::post('/steadfast-webhook', [WebhookController::class, 'handleSteadfastWebhook']);