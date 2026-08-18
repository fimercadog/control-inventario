<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Resources\BodegaResource;
use App\Http\Support\ApiResponse;
use App\Models\Bodega;
use App\Models\ProductoBodega;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Administración del catálogo de bodegas y consulta de sus saldos.
 * La modificación de existencias sigue centralizada en InventoryService;
 * este controller no escribe nunca producto_bodega directamente.
 */
class BodegaController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly AuditLogger $auditoria,
    ) {}

    public function index(): JsonResponse
    {
        $bodegas = $this->paraEmpresaActual(Bodega::query())
            ->withCount('productoBodegas')
            ->orderByDesc('es_principal')
            ->orderBy('nombre')
            ->get();

        return ApiResponse::success(BodegaResource::collection($bodegas));
    }

    public function store(Request $request): JsonResponse
    {
        $empresaId = $request->user()->empresa_id;
        $datos = $request->validate([
            'nombre' => [
                'required', 'string', 'max:255',
                Rule::unique('bodegas', 'nombre')->where(fn ($query) => $query->where('empresa_id', $empresaId)),
            ],
            'es_principal' => ['sometimes', 'boolean'],
        ]);

        $bodega = DB::transaction(function () use ($datos, $empresaId) {
            if (($datos['es_principal'] ?? false) === true) {
                Bodega::query()->where('empresa_id', $empresaId)->update(['es_principal' => false]);
            }

            return Bodega::create([
                'empresa_id' => $empresaId,
                'nombre' => $datos['nombre'],
                'es_principal' => $datos['es_principal'] ?? false,
                'estado' => 'activo',
            ]);
        });

        $this->auditoria->registrarAccionManual(
            empresaId: $empresaId,
            usuarioId: $request->user()->id,
            modulo: 'bodegas',
            accion: 'bodegas.crear',
            auditableType: Bodega::class,
            auditableId: $bodega->id,
            valoresNuevos: $bodega->only(['nombre', 'es_principal', 'estado']),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(new BodegaResource($bodega), 'Bodega creada correctamente', 201);
    }

    public function productos(Request $request, int $bodega): JsonResponse
    {
        $bodega = $this->resolverParaEmpresaActual(Bodega::class, $bodega);
        $saldos = $this->paraEmpresaActual(ProductoBodega::query())
            ->where('bodega_id', $bodega->id)
            ->with('producto.unidadMedida')
            ->orderBy('producto_id')
            ->paginate($this->perPageDeRequest($request, 100));

        return ApiResponse::success([
            'bodega' => new BodegaResource($bodega),
            'items' => $saldos->getCollection()->map(fn (ProductoBodega $saldo) => [
                'producto_id' => $saldo->producto_id,
                'producto' => $saldo->producto?->nombre,
                'producto_codigo' => $saldo->producto?->codigo,
                'unidad_medida' => $saldo->producto?->unidadMedida?->abreviatura,
                'stock_actual' => (float) $saldo->stock_actual,
            ])->values(),
            'meta' => $this->metaDePaginacion($saldos),
        ]);
    }
}
