<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\CapturaIAController;
use Illuminate\Support\Facades\Route;

// Módulo Auth (Fase 5, docs/06_API.md). login/refresh/olvide/restablecer no
// exigen sesión (son justamente cómo se consigue una); logout/me sí.
Route::prefix('v1/auth')->name('auth.')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->name('login');
    Route::post('refresh', [AuthController::class, 'refresh'])->name('refresh');
    Route::post('password/olvide', [PasswordResetController::class, 'olvide'])->name('password.olvide');
    Route::post('password/restablecer', [PasswordResetController::class, 'restablecer'])->name('password.restablecer');

    // 'tenant' (no solo 'auth:api'): /me devuelve `permissions`, que
    // depende del team id de Spatie ya fijado (docs/04_ARCHITECTURE.md,
    // Módulo 2 — Company Isolation).
    Route::middleware(['auth:api', 'tenant'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('me', [AuthController::class, 'me'])->name('me');
    });
});

// Todas las rutas de este módulo viven bajo /api/v1/captura-ia (sección 74
// del master spec, punto 7). Ningún proveedor de IA tiene su propio
// endpoint. ['auth:api', 'tenant'] juntos, siempre — nunca 'auth:api' solo
// en una ruta de negocio (docs/04_ARCHITECTURE.md, Módulo 2 — Company
// Isolation): 'tenant' es lo que fija TenantContext y hace que TenantScope
// filtre automáticamente cada consulta a Producto/Movimiento/CapturaIA/etc.
Route::prefix('v1/captura-ia')->name('captura-ia.')->middleware(['auth:api', 'tenant'])->group(function () {
    Route::post('foto', [CapturaIAController::class, 'foto'])->name('foto');
    Route::post('voz', [CapturaIAController::class, 'voz'])->name('voz');
    Route::post('foto-voz', [CapturaIAController::class, 'fotoVoz'])->name('foto-voz');
    Route::get('/', [CapturaIAController::class, 'index'])->name('index');
    Route::get('{captura}', [CapturaIAController::class, 'show'])->name('show');
    Route::patch('{captura}/detalle/{detalleId}', [CapturaIAController::class, 'actualizarDetalle'])->name('detalle.actualizar');
    Route::post('{captura}/confirmar', [CapturaIAController::class, 'confirmar'])->name('confirmar');
    Route::post('{captura}/descartar', [CapturaIAController::class, 'descartar'])->name('descartar');
});
