<?php

namespace App\Http\Controllers\Api;

use App\Enums\TipoMovimiento;
use App\Http\Controllers\Controller;
use App\Http\Requests\Movimiento\StoreMovimientoRequest;
use App\Http\Requests\Movimiento\UpdateMovimientoRequest;
use App\Http\Resources\Movimiento\MovimientoResource;
use App\Http\Support\ApiResponse;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Services\Audit\AuditLogger;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Módulo global de
 * Movimientos — vista y creación transversal a todos los productos,
 * distinto de `ProductoController::movimientos()` (el historial acotado
 * a un solo producto dentro de su Ficha, sin cambios).
 *
 * Reglas de negocio confirmadas explícitamente por el propietario del
 * proyecto antes de esta unidad de trabajo, y jamás relajadas aquí:
 * - Un movimiento es el registro contable del inventario. `cantidad`,
 *   `tipo`, `producto_id`, `proveedor_id`, `stock_anterior` y
 *   `stock_nuevo` son inmutables para siempre una vez creado — nunca
 *   hay un DELETE, ni un "anular"/deshabilitar. Cualquier corrección se
 *   hace registrando un Ajuste compensatorio nuevo, nunca editando ni
 *   ocultando el original.
 * - `update()` solo puede tocar metadata descriptiva (`documento`,
 *   `observacion`, `lote`, `vencimiento`) — jamás los campos anteriores.
 * - Toda escritura de `stock_actual` sigue pasando exclusivamente por
 *   `InventoryService::registrarMovimiento()`, nunca directamente aquí.
 */
class MovimientoController extends Controller
{
    public function __construct(
        private readonly InventoryService $inventario,
        private readonly AuditLogger $auditoria,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Movimiento::class);

        $query = Movimiento::query()->with(['producto.unidadMedida', 'usuario', 'capturaDetalle.captura']);

        if ($productoId = $request->query('producto_id')) {
            $query->where('producto_id', $productoId);
        }

        if ($tipo = $request->query('tipo')) {
            $query->where('tipo', $tipo);
        }

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('documento', 'like', "%{$busqueda}%")
                    ->orWhereHas('producto', function ($p) use ($busqueda) {
                        $p->where('nombre', 'like', "%{$busqueda}%")
                            ->orWhere('codigo', 'like', "%{$busqueda}%");
                    });
            });
        }

        if ($desde = $request->query('desde')) {
            $query->whereDate('created_at', '>=', $desde);
        }

        if ($hasta = $request->query('hasta')) {
            $query->whereDate('created_at', '<=', $hasta);
        }

        $movimientos = $query->latest()->paginate(100);

        return ApiResponse::success([
            'items' => MovimientoResource::collection($movimientos)->resolve(),
            'meta' => [
                'current_page' => $movimientos->currentPage(),
                'per_page' => $movimientos->perPage(),
                'total' => $movimientos->total(),
                'last_page' => $movimientos->lastPage(),
            ],
        ]);
    }

    public function show(Movimiento $movimiento): JsonResponse
    {
        $this->authorize('view', $movimiento);

        return ApiResponse::success(new MovimientoResource($movimiento->load(['producto.unidadMedida', 'usuario', 'capturaDetalle.captura'])));
    }

    /**
     * Único punto de "Crear" de este módulo — Entrada/Salida/Ajuste,
     * todos vía `InventoryService::registrarMovimiento()`. `direccion`
     * solo se traduce a un signo explícito para Ajuste (el único tipo
     * bidireccional); Entrada/Salida dejan que `InventoryService` decida
     * su dirección como siempre.
     */
    public function store(StoreMovimientoRequest $request): JsonResponse
    {
        $this->authorize('create', Movimiento::class);

        $datos = $request->validated();
        $producto = Producto::findOrFail($datos['producto_id']);
        $tipo = TipoMovimiento::from($datos['tipo']);

        $direccion = null;
        if ($tipo === TipoMovimiento::Ajuste) {
            $direccion = $datos['direccion'] === 'decremento' ? -1 : 1;
        }

        $proveedorNombre = null;
        if (! empty($datos['proveedor_id'])) {
            $proveedorNombre = Proveedor::findOrFail($datos['proveedor_id'])->nombre;
        }

        $movimiento = $this->inventario->registrarMovimiento(
            producto: $producto,
            tipo: $tipo,
            cantidad: (float) $datos['cantidad'],
            documento: $datos['documento'] ?? null,
            observacion: $datos['observacion'] ?? null,
            usuarioId: $request->user()->id,
            costo: isset($datos['costo']) ? (float) $datos['costo'] : null,
            precio: isset($datos['precio']) ? (float) $datos['precio'] : null,
            proveedor: $proveedorNombre,
            lote: $datos['lote'] ?? null,
            vencimiento: $datos['vencimiento'] ?? null,
            proveedorId: $datos['proveedor_id'] ?? null,
            direccion: $direccion,
        );

        $this->auditoria->registrarAccionManual(
            empresaId: $producto->empresa_id,
            usuarioId: $request->user()->id,
            modulo: 'movimientos',
            accion: "movimientos.registrar_{$tipo->value}",
            auditableType: Movimiento::class,
            auditableId: $movimiento->id,
            valoresNuevos: $movimiento->only(['producto_id', 'tipo', 'cantidad', 'stock_anterior', 'stock_nuevo']),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(
            new MovimientoResource($movimiento->load(['producto.unidadMedida', 'usuario', 'capturaDetalle.captura'])),
            'Movimiento registrado correctamente',
            201
        );
    }

    /**
     * Solo metadata descriptiva — ver `UpdateMovimientoRequest`. El
     * registro contable del movimiento (cantidad/tipo/producto/stock)
     * nunca es editable, sin excepción.
     */
    public function update(UpdateMovimientoRequest $request, Movimiento $movimiento): JsonResponse
    {
        $this->authorize('update', $movimiento);

        $movimiento->update($request->validated());

        $this->auditoria->registrarAccionManual(
            empresaId: $movimiento->empresa_id,
            usuarioId: $request->user()->id,
            modulo: 'movimientos',
            accion: 'movimientos.editar_metadata',
            auditableType: Movimiento::class,
            auditableId: $movimiento->id,
            valoresNuevos: $movimiento->only(['documento', 'observacion', 'lote', 'vencimiento']),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(
            new MovimientoResource($movimiento->fresh()->load(['producto.unidadMedida', 'usuario', 'capturaDetalle.captura'])),
            'Movimiento actualizado correctamente'
        );
    }
}
