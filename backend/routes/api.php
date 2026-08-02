<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\CapturaIAController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\MarcaController;
use App\Http\Controllers\Api\MovimientoController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\ProductoProveedorController;
use App\Http\Controllers\Api\ProveedorController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\UnidadMedidaController;
use App\Http\Controllers\Api\UserController;
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
    // Corrección de auditoría funcional (docs/06_TESTS/DemoDataAudit.md) — borrado siempre lógico.
    Route::post('{producto}/deshabilitar', [ProductoController::class, 'disable'])->name('disable');
    Route::post('{producto}/habilitar', [ProductoController::class, 'enable'])->name('enable');

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

// RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Categories.md). Borrado siempre
// lógico — mismo patrón exacto que Proveedores.
Route::prefix('v1/categorias')->name('categorias.')->middleware(['auth:api', 'tenant'])->group(function () {
    Route::get('/', [CategoriaController::class, 'index'])->name('index');
    Route::post('/', [CategoriaController::class, 'store'])->name('store');
    Route::get('{categoria}', [CategoriaController::class, 'show'])->name('show');
    Route::patch('{categoria}', [CategoriaController::class, 'update'])->name('update');
    Route::post('{categoria}/deshabilitar', [CategoriaController::class, 'disable'])->name('disable');
    Route::post('{categoria}/habilitar', [CategoriaController::class, 'enable'])->name('enable');
    // Ficha de Categoría — pestaña "Productos".
    Route::get('{categoria}/productos', [CategoriaController::class, 'productos'])->name('productos');
});

// RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Brands.md). Borrado siempre lógico —
// mismo patrón exacto que Categorías/Proveedores.
Route::prefix('v1/marcas')->name('marcas.')->middleware(['auth:api', 'tenant'])->group(function () {
    Route::get('/', [MarcaController::class, 'index'])->name('index');
    Route::post('/', [MarcaController::class, 'store'])->name('store');
    Route::get('{marca}', [MarcaController::class, 'show'])->name('show');
    Route::patch('{marca}', [MarcaController::class, 'update'])->name('update');
    Route::post('{marca}/deshabilitar', [MarcaController::class, 'disable'])->name('disable');
    Route::post('{marca}/habilitar', [MarcaController::class, 'enable'])->name('enable');
    // Ficha de Marca — pestaña "Productos".
    Route::get('{marca}/productos', [MarcaController::class, 'productos'])->name('productos');
});

// RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). Borrado siempre
// lógico — mismo patrón exacto que Categorías/Marcas/Proveedores.
Route::prefix('v1/unidades-medida')->name('unidades-medida.')->middleware(['auth:api', 'tenant'])->group(function () {
    Route::get('/', [UnidadMedidaController::class, 'index'])->name('index');
    Route::post('/', [UnidadMedidaController::class, 'store'])->name('store');
    Route::get('{unidadMedida}', [UnidadMedidaController::class, 'show'])->name('show');
    Route::patch('{unidadMedida}', [UnidadMedidaController::class, 'update'])->name('update');
    Route::post('{unidadMedida}/deshabilitar', [UnidadMedidaController::class, 'disable'])->name('disable');
    Route::post('{unidadMedida}/habilitar', [UnidadMedidaController::class, 'enable'])->name('enable');
    // Ficha de Unidad de Medida — pestaña "Productos".
    Route::get('{unidadMedida}/productos', [UnidadMedidaController::class, 'productos'])->name('productos');
});

// RC1 Fase 2 (docs/03_FUNCTIONAL_SPEC/Stock.md). Stock NO es una entidad
// independiente — opera directamente sobre Producto, acotado a sus
// campos de stock. Sin ruta POST '/' a propósito: no existe "crear un
// Stock", cada producto ya nace con sus propios campos de stock.
Route::prefix('v1/stock')->name('stock.')->middleware(['auth:api', 'tenant'])->group(function () {
    Route::get('/', [StockController::class, 'index'])->name('index');
    Route::get('{producto}', [StockController::class, 'show'])->name('show');
    Route::patch('{producto}', [StockController::class, 'update'])->name('update');
    Route::post('{producto}/deshabilitar', [StockController::class, 'disable'])->name('disable');
    Route::post('{producto}/habilitar', [StockController::class, 'enable'])->name('enable');
});

// RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Módulo global —
// distinto de GET /productos/{producto}/movimientos (historial acotado a
// un solo producto, sin cambios). Un movimiento nunca se elimina ni se
// anula: sin rutas de deshabilitar/habilitar/DELETE a propósito.
Route::prefix('v1/movimientos')->name('movimientos.')->middleware(['auth:api', 'tenant'])->group(function () {
    Route::get('/', [MovimientoController::class, 'index'])->name('index');
    Route::post('/', [MovimientoController::class, 'store'])->name('store');
    Route::get('{movimiento}', [MovimientoController::class, 'show'])->name('show');
    Route::patch('{movimiento}', [MovimientoController::class, 'update'])->name('update');
});

// RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md). Listar/Ver/Activar/
// Desactivar únicamente — sin POST / (creación es Módulo 6, Invitaciones,
// sin construir) y sin ningún endpoint de eliminar (Usuarios nunca se
// elimina, física ni lógicamente). `{id}` en vez de route-model-binding
// implícito a propósito: User no tiene TenantScope automático, así que
// cada acción resuelve el usuario ya acotado por empresa a mano.
Route::prefix('v1/usuarios')->name('usuarios.')->middleware(['auth:api', 'tenant'])->group(function () {
    Route::get('/', [UserController::class, 'index'])->name('index');
    Route::get('{id}', [UserController::class, 'show'])->name('show')->whereNumber('id');
    Route::post('{id}/activar', [UserController::class, 'activar'])->name('activar')->whereNumber('id');
    Route::post('{id}/desactivar', [UserController::class, 'desactivar'])->name('desactivar')->whereNumber('id');
});
