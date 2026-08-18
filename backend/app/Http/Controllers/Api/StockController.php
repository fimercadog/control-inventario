<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\UpdateStockRequest;
use App\Http\Resources\Stock\StockResource;
use App\Http\Support\ApiResponse;
use App\Models\Producto;
use App\Policies\StockPolicy;
use App\Services\Audit\AuditLogger;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RC1 Fase 2 (docs/03_FUNCTIONAL_SPEC/Stock.md). Decisión arquitectónica
 * confirmada explícitamente por el propietario del proyecto: Stock NO es
 * una entidad independiente — no existe tabla `stock` ni modelo `Stock`.
 * Este controller opera directamente sobre `Producto` (`FiltersByEmpresa`
 * resuelve `{producto}` explícitamente vía `resolverParaEmpresaActual()` +
 * `ProductoPolicy` como segunda capa, mismo patrón que `ProductoController`),
 * acotado exclusivamente a sus campos de stock.
 *
 * Fase 4.5 (Authorization Alignment): usa `StockPolicy` (dedicada, no
 * `ProductoPolicy`) invocada directamente vía `authorizeStock()` — el
 * helper `$this->authorize()` resolvería siempre a `ProductoPolicy` por
 * ser `Producto` el modelo, gateando estas acciones con el permiso
 * equivocado (`productos.*` en vez de `stock.*`). Ver `StockPolicy` para
 * el detalle completo.
 *
 * Reglas de negocio, ya acordadas y NUNCA relajadas por este controller:
 * - No existe `store()`: un producto ya nace con sus campos de stock
 *   (`stock_actual = 0`, `stock_minimo`/`stock_maximo` desde su alta),
 *   no hay "crear un Stock" independiente.
 * - `update()` solo puede tocar `stock_minimo`/`stock_maximo` (umbrales
 *   de alerta) — `stock_actual` sigue siendo propiedad exclusiva de
 *   `InventoryService::registrarMovimiento()`; la única forma real de
 *   cambiar la cantidad es Entrada/Salida/Ajuste (Movimientos).
 * - `disable()`/`enable()` tocan únicamente `stock_estado` (bandera
 *   administrativa propia de este módulo, independiente de
 *   `productos.estado`) — nunca modifican `stock_actual`, nunca generan
 *   un movimiento, nunca afectan si el producto sigue siendo válido en
 *   Productos/Captura IA/Proveedores/Movimientos.
 */
class StockController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly AuditLogger $auditoria,
        private readonly StockPolicy $stockPolicy,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorizeStock('viewAny');

        // Incluye agotados automáticos aunque su catálogo quede inactivo:
        // Stock es justamente el lugar desde el que se registrará la
        // reposición que los reactiva. Los inactivos manuales también se
        // conservan visibles aquí para auditoría y control de existencias.
        $query = $this->paraEmpresaActual(Producto::query())
            ->with(['categoria', 'marca', 'unidadMedida']);

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhere('codigo', 'like', "%{$busqueda}%");
            });
        }

        // Por defecto solo Stock activo — inactivo visible únicamente vía
        // filtro explícito (GLOBAL UI STANDARD, mismo criterio que el
        // resto de los módulos).
        $estado = $request->query('estado', 'activo');
        if ($estado !== 'todos') {
            $query->where('stock_estado', $estado);
        }

        if ($request->boolean('bajo_minimo')) {
            // El umbral de seguridad se alcanza también en igualdad: 5 de
            // 5 ya requiere reposición, no solo 4 de 5.
            $query->whereColumn('stock_actual', '<=', 'stock_minimo');
        }

        $productos = $query->orderBy('nombre')->paginate($this->perPageDeRequest($request, 100));

        return ApiResponse::success([
            'items' => StockResource::collection($productos)->resolve(),
            'meta' => $this->metaDePaginacion($productos),
        ]);
    }

    public function show(int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorizeStock('view', $producto);

        return ApiResponse::success(new StockResource($producto->load(['categoria', 'marca', 'unidadMedida'])));
    }

    /**
     * Simplificación 2026-08-09 (mismo hallazgo ya corregido en
     * Categoria/Marca/UnidadMedidaController): `$producto->update()` ya
     * refleja los nuevos valores en la instancia en memoria — un
     * `->fresh()` posterior es un SELECT evitable, ningún observer ni
     * default de BD altera `stock_minimo`/`stock_maximo` después del
     * UPDATE.
     */
    public function update(UpdateStockRequest $request, int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorizeStock('update', $producto);

        $producto->update($request->validated());

        $this->registrarAuditoria($request, $producto, 'stock.editar', $producto->only(['stock_minimo', 'stock_maximo']));

        return ApiResponse::success(
            new StockResource($producto->load(['categoria', 'marca', 'unidadMedida'])),
            'Stock actualizado correctamente'
        );
    }

    /**
     * GLOBAL RULE + regla específica de Stock (confirmada explícitamente
     * por el propietario del proyecto): deshabilitar el registro de
     * Stock de un producto es puramente administrativo. Nunca pone
     * `stock_actual` en cero, nunca genera un movimiento de reversa,
     * nunca modifica `productos.estado` (el producto sigue siendo válido
     * en el resto del sistema). Solo lo oculta del listado por defecto
     * de este módulo.
     */
    public function disable(Request $request, int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorizeStock('delete', $producto);

        $producto->update(['stock_estado' => 'inactivo']);

        $this->registrarAuditoria($request, $producto, 'stock.deshabilitar', ['stock_estado' => 'inactivo']);

        return ApiResponse::success(
            new StockResource($producto->load(['categoria', 'marca', 'unidadMedida'])),
            'Stock deshabilitado correctamente'
        );
    }

    public function enable(Request $request, int $producto): JsonResponse
    {
        $producto = $this->resolverParaEmpresaActual(Producto::class, $producto);
        $this->authorizeStock('update', $producto);

        $producto->update(['stock_estado' => 'activo']);

        $this->registrarAuditoria($request, $producto, 'stock.habilitar', ['stock_estado' => 'activo']);

        return ApiResponse::success(
            new StockResource($producto->load(['categoria', 'marca', 'unidadMedida'])),
            'Stock habilitado correctamente'
        );
    }

    /**
     * Invoca `StockPolicy` directamente en vez de `$this->authorize()` —
     * ver docblock de la clase para el porqué (colisión de Policy con
     * `ProductoPolicy` sobre el mismo modelo `Producto`).
     */
    private function authorizeStock(string $ability, ?Producto $producto = null): void
    {
        $user = request()->user();
        $autorizado = $producto
            ? $this->stockPolicy->{$ability}($user, $producto)
            : $this->stockPolicy->{$ability}($user);

        if (! $autorizado) {
            throw new AuthorizationException('No tienes permiso para realizar esta acción.');
        }
    }

    /**
     * @param array<string, mixed> $valoresNuevos
     */
    private function registrarAuditoria(Request $request, Producto $producto, string $accion, array $valoresNuevos): void
    {
        $this->auditoria->registrarAccionManual(
            empresaId: $producto->empresa_id,
            usuarioId: $request->user()?->id,
            modulo: 'stock',
            accion: $accion,
            auditableType: Producto::class,
            auditableId: $producto->id,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
