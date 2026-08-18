<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\BodegaController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordResetController;
use App\Http\Controllers\Api\CapturaIAController;
use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\ContingenciaProductoController;
use App\Http\Controllers\Api\ContingenciaActividadController;
use App\Http\Controllers\Api\ClienteController;
use App\Http\Controllers\Api\CrmController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvitationController;
use App\Http\Controllers\Api\MarcaController;
use App\Http\Controllers\Api\MovimientoController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ProductoController;
use App\Http\Controllers\Api\ProductoProveedorController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ProveedorController;
use App\Http\Controllers\Api\ReporteController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\UnidadMedidaController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Módulo Auth (Fase 5, docs/06_API.md). login/refresh/olvide/restablecer no
// exigen sesión (son justamente cómo se consigue una); logout/me sí.
Route::prefix('v1/auth')->name('auth.')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->name('login');
    Route::post('refresh', [AuthController::class, 'refresh'])->name('refresh');
    // throttle:6,1 añadido 2026-08-09 — mecanismo mínimo nativo de Laravel
    // pedido explícitamente para este flujo (Work Order "Recuperación de
    // Contraseña", sección 6). `login`/`refresh` quedan sin cambios aquí
    // deliberadamente — llevarían el mismo throttle, pero es una decisión
    // aparte, ya documentada como riesgo pendiente en Authentication.md.
    Route::post('password/olvide', [PasswordResetController::class, 'olvide'])
        ->middleware('throttle:6,1')
        ->name('password.olvide');
    Route::post('password/restablecer', [PasswordResetController::class, 'restablecer'])
        ->middleware('throttle:6,1')
        ->name('password.restablecer');

    // 'empresa' (no solo 'auth:api'): /me devuelve `permissions`, que
    // depende del team id de Spatie ya fijado (docs/04_ARCHITECTURE.md,
    // Módulo 2 — Company Isolation).
    Route::middleware(['auth:api', 'empresa'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('me', [AuthController::class, 'me'])->name('me');
    });
});

// Dashboard (2026-08-11, cierre definitivo — antes 100% mock data en el
// frontend). Sin permiso propio a propósito (docs/03_FUNCTIONAL_SPEC/Dashboard.md):
// cualquier usuario autenticado de una empresa la ve, mismo criterio que
// GET /auth/me.
Route::prefix('v1/dashboard')->name('dashboard.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [DashboardController::class, 'index'])->name('index');
});

// Todas las rutas de este módulo viven bajo /api/v1/captura-ia (sección 74
// del master spec, punto 7). Ningún proveedor de IA tiene su propio
// endpoint. ['auth:api', 'empresa'] juntos, siempre — nunca 'auth:api' solo
// en una ruta de negocio (docs/04_ARCHITECTURE.md, Módulo 2 — Company
// Isolation): 'empresa' fija el team id de Spatie; el filtrado real por
// empresa_id lo hace `FiltersByEmpresa` explícito en cada Controller
// (ADR-019 — sin Global Scope automático).
Route::prefix('v1/captura-ia')->name('captura-ia.')->middleware(['auth:api', 'empresa'])->group(function () {
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
// de movimientos de ESE producto — nunca stock_actual, nunca los módulos
// Kardex/Exportaciones completos (siguen sin construir en
// docs/03_FUNCTIONAL_SPEC/FUTURE/; Auditoría, en cambio, sí está construida
// y cerrada, ver docs/03_FUNCTIONAL_SPEC/Auditoria.md).
Route::prefix('v1/productos')->name('productos.')->middleware(['auth:api', 'empresa'])->group(function () {
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
Route::prefix('v1/proveedores')->name('proveedores.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [ProveedorController::class, 'index'])->name('index');
    Route::post('/', [ProveedorController::class, 'store'])->name('store');
    // Exportación (WO "Módulo Proveedores") — declaradas antes de {proveedor},
    // que tampoco tiene whereNumber() aquí (mismo cuidado ya aplicado en
    // categorias.{categoria}/roles.{role}): sin este orden, "export" se
    // resolvería como show(proveedor: "export") en silencio.
    Route::get('export/csv', [ProveedorController::class, 'exportarCsv'])->name('export.csv');
    Route::get('export/pdf', [ProveedorController::class, 'exportarPdf'])->name('export.pdf');
    Route::get('{proveedor}', [ProveedorController::class, 'show'])->name('show');
    Route::patch('{proveedor}', [ProveedorController::class, 'update'])->name('update');
    Route::post('{proveedor}/deshabilitar', [ProveedorController::class, 'disable'])->name('disable');
    Route::post('{proveedor}/habilitar', [ProveedorController::class, 'enable'])->name('enable');
    // FEATURE-005: "Products" tab de la Ficha de Proveedor.
    Route::get('{proveedor}/productos', [ProveedorController::class, 'productos'])->name('productos');
});

// Módulo Clientes (2026-08-02, docs/03_FUNCTIONAL_SPEC/Customers.md).
// Borrado siempre lógico — mismo patrón exacto que Proveedores.
Route::prefix('v1/clientes')->name('clientes.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [ClienteController::class, 'index'])->name('index');
    Route::post('/', [ClienteController::class, 'store'])->name('store');
    Route::get('{cliente}', [ClienteController::class, 'show'])->name('show');
    Route::patch('{cliente}', [ClienteController::class, 'update'])->name('update');
    Route::post('{cliente}/deshabilitar', [ClienteController::class, 'disable'])->name('disable');
    Route::post('{cliente}/habilitar', [ClienteController::class, 'enable'])->name('enable');
});

// CRM comercial. La autorización fina se incorpora mediante los permisos
// sembrados; el aislamiento se mantiene explícito con FiltersByEmpresa en el
// controller, igual que en los módulos existentes.
Route::prefix('v1')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('contactos', [CrmController::class, 'contactos'])->middleware('permission:contactos.ver');
    Route::post('contactos', [CrmController::class, 'crearContacto'])->middleware('permission:contactos.crear');
    Route::patch('contactos/{contacto}', [CrmController::class, 'actualizarContacto'])->middleware('permission:contactos.editar')->whereNumber('contacto');
    Route::post('contactos/{contacto}/convertir', [CrmController::class, 'convertirContacto'])->middleware('permission:contactos.convertir')->whereNumber('contacto');
    Route::get('etapas-oportunidad', [CrmController::class, 'etapas'])->middleware('permission:oportunidades.ver');
    Route::post('etapas-oportunidad', [CrmController::class, 'crearEtapa'])->middleware('permission:oportunidades.gestionar');
    Route::get('oportunidades', [CrmController::class, 'oportunidades'])->middleware('permission:oportunidades.ver');
    Route::post('oportunidades', [CrmController::class, 'crearOportunidad'])->middleware('permission:oportunidades.crear');
    Route::post('oportunidades/{oportunidad}/cambiar-etapa', [CrmController::class, 'cambiarEtapa'])->middleware('permission:oportunidades.editar')->whereNumber('oportunidad');
    Route::get('actividades', [CrmController::class, 'actividades'])->middleware('permission:actividades.ver');
    Route::post('actividades', [CrmController::class, 'crearActividad'])->middleware('permission:actividades.crear');
    Route::post('actividades/{actividad}/completar', [CrmController::class, 'completarActividad'])->middleware('permission:actividades.completar')->whereNumber('actividad');
    Route::get('automatizaciones', [CrmController::class, 'automatizaciones'])->middleware('permission:automatizaciones.ver');
    Route::post('automatizaciones', [CrmController::class, 'crearAutomatizacion'])->middleware('permission:automatizaciones.gestionar');
    Route::get('notificaciones', [CrmController::class, 'notificaciones']);
    Route::post('notificaciones/{notificacion}/leer', [CrmController::class, 'leerNotificacion'])->whereNumber('notificacion');
});

// RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Categories.md). Borrado siempre
// lógico — mismo patrón exacto que Proveedores.
Route::prefix('v1/categorias')->name('categorias.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [CategoriaController::class, 'index'])->name('index');
    Route::post('/', [CategoriaController::class, 'store'])->name('store');
    // Exportación (Work Order "Categorías: Exportación CSV y PDF") —
    // declaradas antes de {categoria}, que tampoco tiene whereNumber() aquí
    // (mismo cuidado ya aplicado en roles.{role}): sin este orden, "export"
    // se resolvería como show(categoria: "export") en silencio.
    Route::get('export/csv', [CategoriaController::class, 'exportarCsv'])->name('export.csv');
    Route::get('export/pdf', [CategoriaController::class, 'exportarPdf'])->name('export.pdf');
    Route::get('{categoria}', [CategoriaController::class, 'show'])->name('show');
    Route::patch('{categoria}', [CategoriaController::class, 'update'])->name('update');
    Route::post('{categoria}/deshabilitar', [CategoriaController::class, 'disable'])->name('disable');
    Route::post('{categoria}/habilitar', [CategoriaController::class, 'enable'])->name('enable');
    // Ficha de Categoría — pestaña "Productos".
    Route::get('{categoria}/productos', [CategoriaController::class, 'productos'])->name('productos');
});

// RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Brands.md). Borrado siempre lógico —
// mismo patrón exacto que Categorías/Proveedores.
Route::prefix('v1/marcas')->name('marcas.')->middleware(['auth:api', 'empresa'])->group(function () {
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
Route::prefix('v1/unidades-medida')->name('unidades-medida.')->middleware(['auth:api', 'empresa'])->group(function () {
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
Route::prefix('v1/stock')->name('stock.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [StockController::class, 'index'])->name('index');
    Route::get('{producto}', [StockController::class, 'show'])->name('show');
    Route::patch('{producto}', [StockController::class, 'update'])->name('update');
    Route::post('{producto}/deshabilitar', [StockController::class, 'disable'])->name('disable');
    Route::post('{producto}/habilitar', [StockController::class, 'enable'])->name('enable');
});

// Inventario por bodega: el catálogo y sus saldos se consultan con el
// permiso de lectura de stock; crear ubicaciones requiere gestionarlo.
Route::prefix('v1/bodegas')->name('bodegas.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [BodegaController::class, 'index'])->middleware('permission:stock.ver')->name('index');
    Route::post('/', [BodegaController::class, 'store'])->middleware('permission:stock.gestionar')->name('store');
    Route::get('{bodega}/productos', [BodegaController::class, 'productos'])->middleware('permission:stock.ver')->whereNumber('bodega')->name('productos');
});

// RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Módulo global —
// distinto de GET /productos/{producto}/movimientos (historial acotado a
// un solo producto, sin cambios). Un movimiento nunca se elimina ni se
// anula: sin rutas de deshabilitar/habilitar/DELETE a propósito.
Route::prefix('v1/movimientos')->name('movimientos.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [MovimientoController::class, 'index'])->name('index');
    Route::post('/', [MovimientoController::class, 'store'])->name('store');
    Route::get('{movimiento}', [MovimientoController::class, 'show'])->name('show');
    Route::patch('{movimiento}', [MovimientoController::class, 'update'])->name('update');
});

// Modo Contingencia (docs/03_FUNCTIONAL_SPEC/ProductContingencyMode.md) —
// único endpoint: procesa UNA operación offline de Producto por vez,
// manual, nunca en lote (sección 8 del Work Order). RBAC real vía
// ProductoPolicy, sin excepción — el Modo Contingencia nunca otorga
// ningún permiso nuevo.
Route::prefix('v1/contingencia/productos')->name('contingencia.productos.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::post('sincronizar', [ContingenciaProductoController::class, 'sincronizar'])->name('sincronizar');
});

// CRM en contingencia: sólo creación manual de actividades. No incluye
// oportunidades, etapas ni automatizaciones porque esas transiciones pueden
// entrar en conflicto con cambios comerciales realizados en línea.
Route::post('v1/contingencia/actividades/sincronizar', [ContingenciaActividadController::class, 'sincronizar'])
    ->middleware(['auth:api', 'empresa', 'permission:actividades.crear'])
    ->name('contingencia.actividades.sincronizar');

// RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md), ampliado 2026-08-03 y
// 2026-08-04 (ADR-015, PATCH + avatar). Listar/Ver/Editar/Activar/
// Desactivar/Asignar rol — sin POST / propio (crear sigue siendo
// exclusivo de InvitationController::aceptar()) y sin ningún endpoint de
// eliminar (Usuarios nunca se elimina, física ni lógicamente). `PATCH
// {id}` solo toca campos Operational (theme/language/timezone) — `name`/
// `email` son Identity, nunca aceptados aquí. `{id}` en vez de
// route-model-binding implícito a propósito (ADR-019: sin Global Scope
// automático en ningún modelo) — cada acción resuelve el usuario ya
// acotado por empresa a mano. `invitar` declarada antes de `{id}` a
// propósito, aunque `whereNumber('id')` ya evita cualquier colisión real.
Route::prefix('v1/usuarios')->name('usuarios.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [UserController::class, 'index'])->name('index');
    Route::post('invitar', [InvitationController::class, 'store'])->name('invitar');
    // Exportación (Work Order "Usuarios: Exportación CSV y PDF") — literales
    // declaradas antes de {id}, mismo criterio ya usado por `invitar`.
    Route::get('export/csv', [UserController::class, 'exportarCsv'])->name('export.csv');
    Route::get('export/pdf', [UserController::class, 'exportarPdf'])->name('export.pdf');
    Route::get('{id}', [UserController::class, 'show'])->name('show')->whereNumber('id');
    Route::patch('{id}', [UserController::class, 'actualizar'])->name('actualizar')->whereNumber('id');
    Route::post('{id}/activar', [UserController::class, 'activar'])->name('activar')->whereNumber('id');
    Route::post('{id}/desactivar', [UserController::class, 'desactivar'])->name('desactivar')->whereNumber('id');
    Route::post('{id}/rol', [UserController::class, 'asignarRol'])->name('asignar-rol')->whereNumber('id');
    Route::post('{id}/avatar', [UserController::class, 'subirAvatar'])->name('avatar.subir')->whereNumber('id');
    Route::delete('{id}/avatar', [UserController::class, 'eliminarAvatar'])->name('avatar.eliminar')->whereNumber('id');
});

// Módulo 6 — Invitaciones (2026-08-03, docs/03_FUNCTIONAL_SPEC/Users.md).
// Deliberadamente PÚBLICAS (sin 'auth:api'/'empresa') — quien las llama
// todavía no tiene cuenta ni sesión; la posesión del token crudo es la
// única prueba de identidad en este punto, mismo principio que
// /auth/password/restablecer.
Route::prefix('v1/invitaciones')->name('invitaciones.')->group(function () {
    Route::get('{token}', [InvitationController::class, 'show'])->name('show');
    Route::post('{token}/aceptar', [InvitationController::class, 'aceptar'])->name('aceptar');
});

// Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md).
// Sin DELETE a propósito — un rol nunca se elimina físicamente, solo se
// activa/desactiva (mismo verbo que Usuarios, el módulo más análogo).
Route::prefix('v1/roles')->name('roles.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [RoleController::class, 'index'])->name('index');
    Route::post('/', [RoleController::class, 'store'])->name('store');
    // Exportación (Work Order "Roles: Exportación CSV y PDF") — declaradas
    // antes de {role}, que NO tiene whereNumber() aquí (a diferencia de
    // usuarios.{id}): sin este orden, "export" se resolvería como show(role:
    // "export") y estas rutas quedarían inalcanzables en silencio.
    Route::get('export/csv', [RoleController::class, 'exportarCsv'])->name('export.csv');
    Route::get('export/pdf', [RoleController::class, 'exportarPdf'])->name('export.pdf');
    Route::get('{role}', [RoleController::class, 'show'])->name('show');
    Route::patch('{role}', [RoleController::class, 'update'])->name('update');
    Route::post('{role}/activar', [RoleController::class, 'activar'])->name('activar');
    Route::post('{role}/desactivar', [RoleController::class, 'desactivar'])->name('desactivar');
    Route::get('{role}/usuarios', [RoleController::class, 'usuarios'])->name('usuarios');
});

// Catálogo global de solo lectura, para la UI de asignación de permisos a un rol.
Route::get('v1/permisos', [PermissionController::class, 'index'])->name('permisos.index')->middleware(['auth:api', 'empresa']);

// Auditoría (2026-08-02, docs/03_FUNCTIONAL_SPEC/Auditoria.md). Solo
// lectura por diseño — sin POST/PATCH/DELETE, a propósito: AuditLog es
// inmutable y las escrituras son responsabilidad exclusiva de
// Services\Audit\AuditLogger, invocado por los demás módulos.
Route::prefix('v1/auditoria')->name('auditoria.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [AuditLogController::class, 'index'])->name('index');
    Route::get('{auditLog}', [AuditLogController::class, 'show'])->name('show');
});

// Reportes (2026-08-02, ampliado 2026-08-03 a centro de reportes
// completo, docs/03_FUNCTIONAL_SPEC/Reports.md). Rutas estáticas
// (catalogo/historial/programados) declaradas ANTES de la wildcard
// '{clave}' a propósito — si fueran después, Laravel intentaría resolver
// "catalogo"/"historial" como si fueran una clave de reporte.
Route::prefix('v1/reportes')->name('reportes.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::get('/', [ReporteController::class, 'index'])->name('index');
    Route::get('catalogo', [ReporteController::class, 'catalogo'])->name('catalogo');
    Route::get('historial', [ReporteController::class, 'historial'])->name('historial');

    Route::get('programados', [ReporteController::class, 'programadosIndex'])->name('programados.index');
    Route::post('programados', [ReporteController::class, 'programadosStore'])->name('programados.store');
    Route::delete('programados/{programado}', [ReporteController::class, 'programadosDestroy'])->name('programados.destroy');

    Route::get('{clave}/preview', [ReporteController::class, 'preview'])->name('preview');
    Route::get('{clave}/exportar/pdf', [ReporteController::class, 'exportarPdf'])->name('exportar.pdf');
    Route::get('{clave}/exportar/excel', [ReporteController::class, 'exportarExcel'])->name('exportar.excel');
    Route::get('{clave}/exportar/csv', [ReporteController::class, 'exportarCsv'])->name('exportar.csv');
});

// Perfil (2026-08-02, docs/03_FUNCTIONAL_SPEC/Profile.md). Cada método
// opera exclusivamente sobre $request->user() — sin {id} en ninguna ruta,
// a propósito: nunca es posible editar el perfil de otro usuario desde
// aquí. Sin GET — GET /auth/me ya es la fuente de verdad de la ficha propia.
Route::prefix('v1/perfil')->name('perfil.')->middleware(['auth:api', 'empresa'])->group(function () {
    Route::patch('/', [ProfileController::class, 'update'])->name('update');
    Route::post('avatar', [ProfileController::class, 'subirAvatar'])->name('avatar.subir');
    Route::delete('avatar', [ProfileController::class, 'eliminarAvatar'])->name('avatar.eliminar');
    Route::post('password', [ProfileController::class, 'cambiarPassword'])->name('password');
});
