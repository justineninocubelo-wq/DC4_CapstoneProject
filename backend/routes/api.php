
<?php

use App\Http\Controllers\Api\ServiceRequestController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\CustomerController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/services', [ServiceController::class, 'index']);
Route::get('/services/{service}', [ServiceController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/services', [ServiceController::class, 'adminIndex']);
        Route::post('/services', [ServiceController::class, 'store']);
        Route::put('/services/{service}', [ServiceController::class, 'update']);
        Route::patch('/services/{service}', [ServiceController::class, 'update']);
        Route::delete('/services/{service}', [ServiceController::class, 'destroy']);
    });

    Route::get('/admin-test', function (Request $request) {
        return response()->json([
            'message' => 'Admin access confirmed.',
            'user' => $request->user(),
        ]);
    })->middleware('role:admin');

    Route::get('/customers/me', [CustomerController::class, 'me']);

    Route::get('/customers/{customer}', [CustomerController::class, 'show']);

    Route::match(['put', 'patch'], '/customers/{customer}', [
        CustomerController::class, 'update'
    ]);

    Route::get('/service-requests', [ServiceRequestController::class, 'index']);
    Route::post('/service-requests', [ServiceRequestController::class, 'store']);
    Route::get('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'show']);
    Route::put('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'update']);
    Route::patch('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'update']);
    Route::delete('/service-requests/{serviceRequest}', [ServiceRequestController::class, 'destroy']);
    Route::patch('/service-requests/{serviceRequest}/cancel', [ServiceRequestController::class, 'cancel']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/customers', [CustomerController::class, 'index']);

    Route::delete('/customers/{customer}', [
        CustomerController::class, 'destroy'
    ]);
});