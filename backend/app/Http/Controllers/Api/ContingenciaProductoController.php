<?php

namespace App\Http\Controllers\Api;

use App\Enums\Contingencia\TipoOperacionContingencia;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Controller;
use App\Http\Requests\Contingencia\SincronizarOperacionRequest;
use App\Http\Requests\Producto\StoreProductoRequest;
use App\Http\Requests\Producto\UpdateProductoRequest;
use App\Http\Resources\Producto\ProductoResource;
use App\Http\Support\ApiResponse;
use App\Models\Producto;
use App\Services\Audit\AuditLogger;
use App\Services\Contingencia\ContingenciaSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Modo Contingencia (docs/03_FUNCTIONAL_SPEC/ProductContingencyMode.md).
 * Único endpoint del módulo — procesa UNA operación offline de Producto
 * por vez (sección 8 del Work Order: "NO crear un botón global que
 * procese automáticamente todas las operaciones. El procesamiento debe
 * ser MANUAL"). El cliente decide el orden y llama esto una vez por
 * cada clic en "Procesar".
 *
 * RBAC (sección 15 del Work Order): el Modo Contingencia no otorga
 * ningún permiso — reusa `ProductoPolicy` sin cambios. Un usuario sin
 * `productos.crear`/`productos.editar` recibe 403 acá exactamente igual
 * que en `ProductoController`, sin importar que la operación se haya
 * creado offline.
 */
class ContingenciaProductoController extends Controller
{
    use FiltersByEmpresa;

    public function __construct(
        private readonly ContingenciaSyncService $sync,
        private readonly AuditLogger $auditoria,
    ) {
    }

    public function sincronizar(SincronizarOperacionRequest $request): JsonResponse
    {
        $datos = $request->validated();
        $tipo = TipoOperacionContingencia::from($datos['tipo']);

        if ($tipo === TipoOperacionContingencia::Crear) {
            $this->authorize('create', Producto::class);
        } else {
            // Resolución tenant-safe explícita antes de autorizar — mismo
            // patrón que MovimientoController/ProductoController: nunca
            // confiar en un id que llegó del cliente sin antes verificar
            // que pertenece a la empresa actual (también protege contra
            // que una operación offline vieja apunte a un producto que ya
            // no existe o es de otra empresa).
            $producto = $this->resolverParaEmpresaActual(Producto::class, (int) $datos['producto_id']);
            $this->authorize('update', $producto);
        }

        $payloadValidado = $this->validarPayload($tipo, $datos['payload']);

        $producto = $this->sync->procesarOperacion(
            empresaId: $request->user()->empresa_id,
            usuarioId: $request->user()->id,
            operacionId: $datos['operacion_id'],
            tipo: $tipo,
            productoId: $datos['producto_id'] ?? null,
            baseVersion: $datos['base_version'] ?? null,
            payload: $payloadValidado,
        );

        $this->auditoria->registrarAccionManual(
            empresaId: $producto->empresa_id,
            usuarioId: $request->user()->id,
            modulo: 'contingencia',
            accion: "contingencia.procesar_{$tipo->value}",
            auditableType: Producto::class,
            auditableId: $producto->id,
            valoresNuevos: ['operacion_id' => $datos['operacion_id'], ...$producto->only(['codigo', 'nombre'])],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(
            new ProductoResource($producto->load(['categoria', 'marca', 'unidadMedida'])),
            'Operación sincronizada correctamente',
        );
    }

    /**
     * Nunca una copia de las reglas de Producto — valida el payload
     * offline contra las MISMAS reglas que ya usa el formulario en línea
     * (`StoreProductoRequest`/`UpdateProductoRequest`), para que una
     * operación offline nunca pueda colar un dato que el flujo normal
     * rechazaría.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function validarPayload(TipoOperacionContingencia $tipo, array $payload): array
    {
        $reglas = $tipo === TipoOperacionContingencia::Crear
            ? (new StoreProductoRequest())->rules()
            : (new UpdateProductoRequest())->rules();

        return Validator::make($payload, $reglas)->validate();
    }
}
