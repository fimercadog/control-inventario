<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProductoProveedor\StoreProductoProveedorRequest;
use App\Http\Requests\ProductoProveedor\UpdateProductoProveedorRequest;
use App\Http\Resources\ProductoProveedor\ProductoProveedorResource;
use App\Http\Support\ApiResponse;
use App\Models\Producto;
use App\Models\ProductoProveedor;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md): relación
 * muchos-a-muchos Producto↔Proveedor con atributos propios. Nunca un
 * DELETE físico — solo `estado = inactivo` (GLOBAL RULE, sesión 2026-07-29).
 */
class ProductoProveedorController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditoria,
    ) {
    }

    /** "Suppliers" tab en la Ficha de Producto. */
    public function index(Producto $producto): JsonResponse
    {
        $this->authorize('view', $producto);

        $asociaciones = $producto->proveedoresAsociados()
            ->where('estado', 'activo')
            ->with('proveedor')
            ->orderByDesc('es_principal')
            ->get();

        return ApiResponse::success(ProductoProveedorResource::collection($asociaciones)->resolve());
    }

    public function store(StoreProductoProveedorRequest $request, Producto $producto): JsonResponse
    {
        $this->authorize('update', $producto);

        // El proveedor debe pertenecer a la misma empresa — TenantScope ya
        // filtra find(); si no aparece, es de otra empresa o no existe.
        $proveedor = \App\Models\Proveedor::findOrFail($request->validated('proveedor_id'));

        $asociacion = DB::transaction(function () use ($request, $producto, $proveedor) {
            $esPrincipal = (bool) $request->boolean('es_principal');

            if ($esPrincipal) {
                $this->desmarcarPrincipalesAnteriores($producto);
            }

            return ProductoProveedor::create([
                'producto_id' => $producto->id,
                'proveedor_id' => $proveedor->id,
                'es_principal' => $esPrincipal,
                'precio_compra' => $request->validated('precio_compra'),
                'codigo_proveedor' => $request->validated('codigo_proveedor'),
            ]);
        });

        $this->registrarAuditoria($request, $asociacion, 'producto_proveedor.crear');

        return ApiResponse::success(
            new ProductoProveedorResource($asociacion->load('proveedor')),
            'Proveedor asociado correctamente',
            201
        );
    }

    public function update(UpdateProductoProveedorRequest $request, Producto $producto, ProductoProveedor $asociacion): JsonResponse
    {
        $this->authorize('update', $asociacion);
        $this->assertBelongsToProducto($producto, $asociacion);

        DB::transaction(function () use ($request, $producto, $asociacion) {
            if ($request->has('es_principal') && $request->boolean('es_principal')) {
                $this->desmarcarPrincipalesAnteriores($producto, exceptId: $asociacion->id);
            }

            $asociacion->update($request->validated());
        });

        $this->registrarAuditoria($request, $asociacion, 'producto_proveedor.editar');

        return ApiResponse::success(
            new ProductoProveedorResource($asociacion->fresh()->load('proveedor')),
            'Asociación actualizada correctamente'
        );
    }

    public function disable(Request $request, Producto $producto, ProductoProveedor $asociacion): JsonResponse
    {
        $this->authorize('delete', $asociacion);
        $this->assertBelongsToProducto($producto, $asociacion);

        $asociacion->update(['estado' => 'inactivo']);

        $this->registrarAuditoria($request, $asociacion, 'producto_proveedor.deshabilitar');

        return ApiResponse::success(
            new ProductoProveedorResource($asociacion->fresh()),
            'Asociación deshabilitada correctamente'
        );
    }

    /**
     * Regla de negocio: un único proveedor principal activo por
     * producto. Se desmarca cualquier otro antes de marcar uno nuevo.
     */
    private function desmarcarPrincipalesAnteriores(Producto $producto, ?int $exceptId = null): void
    {
        $producto->proveedoresAsociados()
            ->where('es_principal', true)
            ->when($exceptId, fn ($q) => $q->where('id', '!=', $exceptId))
            ->update(['es_principal' => false]);
    }

    private function assertBelongsToProducto(Producto $producto, ProductoProveedor $asociacion): void
    {
        abort_unless($asociacion->producto_id === $producto->id, 404);
    }

    private function registrarAuditoria(Request $request, ProductoProveedor $asociacion, string $accion): void
    {
        $this->auditoria->registrarAccionManual(
            empresaId: $asociacion->empresa_id,
            usuarioId: $request->user()?->id,
            modulo: 'producto_proveedor',
            accion: $accion,
            auditableType: ProductoProveedor::class,
            auditableId: $asociacion->id,
            valoresNuevos: $asociacion->only(['producto_id', 'proveedor_id', 'es_principal', 'estado']),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
