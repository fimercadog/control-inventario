<?php

namespace App\Services\Contingencia;

use App\Enums\Contingencia\TipoOperacionContingencia;
use App\Exceptions\ContingenciaConflictoException;
use App\Exceptions\IdempotencyConflictException;
use App\Models\ContingenciaSyncLog;
use App\Models\Producto;
use App\Services\ProductService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

/**
 * Modo Contingencia (docs/03_FUNCTIONAL_SPEC/ProductContingencyMode.md).
 * Único punto de escritura para procesar una operación offline de
 * Productos — reutiliza `ProductService` (creación real, resolución de
 * catálogo tenant-safe), nunca duplica esa lógica. Nunca toca
 * `stock_actual` ni `InventoryService` (fuera de alcance, sección 5 del
 * Work Order).
 */
class ContingenciaSyncService
{
    public function __construct(
        private readonly ProductService $productos,
    ) {
    }

    /**
     * @param array<string, mixed> $payload ya validado contra
     *        StoreProductoRequest::rules()/UpdateProductoRequest::rules()
     *        (el Controller decide cuál según $tipo — nunca una copia de
     *        esas reglas aquí).
     *
     * @throws ContingenciaConflictoException si $tipo es Actualizar y el
     *         producto cambió en el servidor desde que el cliente capturó
     *         $baseVersion (sección 11 del Work Order).
     * @throws IdempotencyConflictException si otra request con el mismo
     *         $operacionId ganó la carrera (mismo patrón que
     *         `IdempotencyConflictException` de Captura IA).
     */
    public function procesarOperacion(
        int $empresaId,
        ?int $usuarioId,
        string $operacionId,
        TipoOperacionContingencia $tipo,
        ?int $productoId,
        ?string $baseVersion,
        array $payload,
    ): Producto {
        // Idempotencia — sección 10 del Work Order: un reintento del mismo
        // operacion_id (doble clic en "Procesar", reintento de red) nunca
        // vuelve a crear/actualizar. Devuelve el resultado ya real, no un
        // éxito falso.
        $yaProcesada = ContingenciaSyncLog::where('empresa_id', $empresaId)
            ->where('operacion_id', $operacionId)
            ->first();

        if ($yaProcesada !== null) {
            return Producto::findOrFail($yaProcesada->producto_id);
        }

        return DB::transaction(function () use ($empresaId, $usuarioId, $operacionId, $tipo, $productoId, $baseVersion, $payload) {
            $producto = $tipo === TipoOperacionContingencia::Crear
                ? $this->crear($empresaId, $payload)
                : $this->actualizar($empresaId, $productoId, $baseVersion, $payload);

            try {
                ContingenciaSyncLog::create([
                    'empresa_id' => $empresaId,
                    'usuario_id' => $usuarioId,
                    'operacion_id' => $operacionId,
                    'tipo' => $tipo,
                    'producto_id' => $producto->id,
                    'procesado_at' => now(),
                ]);
            } catch (QueryException $e) {
                // Índice único (empresa_id, operacion_id): otra request con
                // el mismo operacion_id ganó la carrera. Todo lo de arriba
                // hace rollback; el llamador recupera el resultado real.
                throw new IdempotencyConflictException($empresaId, $operacionId);
            }

            return $producto;
        });
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function crear(int $empresaId, array $payload): Producto
    {
        return $this->productos->crear([...$payload, 'empresa_id' => $empresaId]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function actualizar(int $empresaId, int $productoId, string $baseVersion, array $payload): Producto
    {
        // Resolución tenant-safe explícita — mismo criterio que
        // `FiltersByEmpresa::resolverParaEmpresaActual()` usa en los demás
        // Controllers (nunca findOrFail() plano sobre un id que llegó del
        // cliente).
        $producto = Producto::where('id', $productoId)->where('empresa_id', $empresaId)->firstOrFail();

        if ($producto->updated_at?->toIso8601String() !== $baseVersion) {
            throw new ContingenciaConflictoException($producto, $baseVersion);
        }

        $datos = $payload;
        if (array_key_exists('marca_nuevo', $datos) || array_key_exists('marca_id', $datos)) {
            $datos['marca_id'] = $this->productos->resolverMarcaId([...$datos, 'empresa_id' => $empresaId]);
        }
        if (array_key_exists('unidad_medida_nuevo', $datos) || array_key_exists('unidad_medida_id', $datos)) {
            $datos['unidad_medida_id'] = $this->productos->resolverUnidadMedidaId([...$datos, 'empresa_id' => $empresaId]);
        }
        if (array_key_exists('categoria_id', $datos)) {
            $datos['categoria_id'] = $this->productos->resolverCategoriaId([...$datos, 'empresa_id' => $empresaId]);
        }

        $producto->update($datos);

        return $producto;
    }
}
