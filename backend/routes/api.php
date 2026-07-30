<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\CapturaIAController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\ProductoProveedorController;
use App\Http\Controllers\Api\ProveedorController;
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

// Ficha de producto (docs/03_FUNCTIONAL_SPEC/Products.md, adenda "Ficha de
// Producto"). Alcance acotado a detalle + edición de catálogo + historial
// de movimientos de ESE producto — nunca stock_actual, nunca el módulo
// Kardex/Auditoría/Exportaciones completos (siguen sin construir en
// docs/03_FUNCTIONAL_SPEC/FUTURE/).
Route::prefix('v1/productos')->name('productos.')->middleware(['auth:api', 'tenant'])->group(function () {
    Route::get('/', [ProductoController::class, 'index'])->name('index');
    Route::post('/', [ProductoController::class, 'store'])->name('store');
    Route::get('{producto}', [ProductoController::class, 'show'])->name('show');
    Route::patch('{producto}', [ProductoController::class, 'update'])->name('update');
    Route::get('{producto}/movimientos', [ProductoController::class, 'movimientos'])->name('movimientos');
    Route::post('{producto}/movimientos', [ProductoController::class, 'registrarIngreso'])->name('movimientos.ingreso');

    // FEATURE-005: "Suppliers" tab de la Ficha de Producto.
    Route::get('{producto}/proveedores', [ProductoProveedorController::class, 'index'])->name('proveedores.index');
    Route::post('{producto}/proveedores', [ProductoProveedorController::class, 'store'])->name('proveedores.store');
    Route::patch('{producto}/proveedores/{asociacion}', [ProductoProveedorController::class, 'update'])->name('proveedores.update');
    Route::post('{producto}/proveedores/{asociacion}/deshabilitar', [ProductoProveedorController::class, 'disable'])->name('proveedores.disable');
});

// FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Borrado siempre
// lógico — 'disable'/'enable' son los únicos mecanismos de "eliminar"/
// restaurar, nunca un DELETE físico (GLOBAL RULE de la sesión 2026-07-29).
Route::prefix('v1/proveedores')->name('proveedores.')->middleware(['auth:api', 'tenant'])->group(function () {
    Route::get('/', [ProveedorController::class, 'index'])->name('index');
    Route::post('/', [ProveedorController::class, 'store'])->name('store');
    Route::get('{proveedor}', [ProveedorController::class, 'show'])->name('show');
    Route::patch('{proveedor}', [ProveedorController::class, 'update'])->name('update');
    Route::post('{proveedor}/deshabilitar', [ProveedorController::class, 'disable'])->name('disable');
    Route::post('{proveedor}/habilitar', [ProveedorController::class, 'enable'])->name('enable');
    // FEATURE-005: "Products" tab de la Ficha de Proveedor.
    Route::get('{proveedor}/productos', [ProveedorController::class, 'productos'])->name('productos');
});
