<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\MissionController;
use App\Http\Controllers\CongeController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', [AuthController::class, 'login']);

Route::get('/departments', [DepartmentController::class, 'index']);

Route::get('/employees', [EmployeeController::class, 'index']);
Route::post('/employees', [EmployeeController::class, 'store']);
Route::put('/employees/{id}', [EmployeeController::class, 'update']);
Route::get('/employees/matricule/{matricule}', [EmployeeController::class, 'showByMatricule']);
Route::get('/employees/matricule/{matricule}/history', [EmployeeController::class, 'getHistoryByMatricule']);
Route::delete('/employees/{id}', [EmployeeController::class, 'destroy']);

Route::get('/missions', [MissionController::class, 'index']);
Route::post('/missions', [MissionController::class, 'store']);
Route::put('/missions/{id}', [MissionController::class, 'update']);
Route::delete('/missions/{id}', [MissionController::class, 'destroy']);

Route::get('/conges', [CongeController::class, 'index']);
Route::post('/conges', [CongeController::class, 'store']);
Route::put('/conges/{id}', [CongeController::class, 'update']);
Route::delete('/conges/{id}', [CongeController::class, 'destroy']);
Route::post('/conges/{id}/close', [CongeController::class, 'closeConge']);

Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
