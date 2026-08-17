<?php

namespace App\Services\CapturaIA;

use App\Actions\CapturaIA\ApplyInventoryMovementAction;
use App\Actions\CapturaIA\MergeDuplicateDetectionsAction;
use App\DTO\AI\DetectedProductDTO;
use App\DTO\CapturaIA\CaptureInputDTO;
use App\Enums\CapturaIA\EstadoCaptura;
use App\Enums\CapturaIA\EstadoCapturaDetalle;
use App\Enums\TipoMovimiento;
use App\Events\AICaptureCompleted;
use App\Exceptions\CapturaIAEstadoInvalidoException;
use App\Exceptions\IdempotencyConflictException;
use App\Models\CapturaIA;
use App\Models\CapturaIADetalle;
use App\Repositories\CapturaIARepository;
use App\Services\Audit\AuditLogger;
use Illuminate\Support\Facades\DB;

/**
 * Orquestador de Captura IA (sección 74 del master spec, "Arquitectura del
 * flujo"). Solo coordina: extrae (Strategy), fusiona duplicados de la
 * propia extracción, y delega en ProductService/InventoryService a través
 * de ApplyInventoryMovementAction. No conoce Eloquent directamente para
 * las reglas de negocio, y no reimplementa ninguna regla de
 * Productos/Inventario (punto 1).
 */
class CapturaIAService
{
    /**
     * Detalles en un estado todavía "abierto": no aplicado ni descartado.
     */
    private const ESTADOS_EDITABLES = [EstadoCapturaDetalle::PendienteRevision, EstadoCapturaDetalle::Corregido];

    public function __construct(
        private readonly CaptureStrategyResolver $resolver,
        private readonly MergeDuplicateDetectionsAction $fusionarDuplicados,
        private readonly ApplyInventoryMovementAction $aplicarMovimiento,
        private readonly CapturaIARepository $repositorio,
        private readonly AuditLogger $auditoria,
    ) {
    }

    public function procesar(CaptureInputDTO $input, ?string $ip = null, ?string $userAgent = null): CapturaIA
    {
        // Idempotencia (sección 74, punto 4): un reintento de red/navegador/app
        // móvil con la misma clave no debe volver a llamar a la IA ni a tocar
        // inventario. Se revisa ANTES de gastar una llamada al proveedor.
        if ($input->idempotencyKey !== null) {
            $existente = $this->buscarPorIdempotencyKey($input->empresaId, $input->idempotencyKey);
            if ($existente !== null) {
                return $existente;
            }
        }

        $estrategia = $this->resolver->resolver($input->tipo);
        // La llamada a la IA queda FUERA de la transacción: es una llamada de
        // red, no debe mantener locks de base de datos mientras dura.
        $resultadoIA = $estrategia->capturar($input);

        try {
            $captura = DB::transaction(function () use ($input, $resultadoIA, $ip, $userAgent) {
                $detecciones = ($this->fusionarDuplicados)($resultadoIA->data->products);

                $tipoMovimiento = TipoMovimiento::tryFrom($resultadoIA->data->movement) ?? TipoMovimiento::Entrada;

                // Transacción única (sección 74, punto 5): creación de producto,
                // creación de movimiento, actualización de stock, persistencia
                // de la captura y su detalle, y el audit log viven todos aquí.
                // Si cualquiera falla, todo se revierte — nada queda a medias.
                $aplicados = [];
                foreach ($detecciones as $deteccion) {
                    $aplicados[] = ($this->aplicarMovimiento)(
                        empresaId: $input->empresaId,
                        detectado: $deteccion,
                        tipoMovimiento: $tipoMovimiento,
                        usuarioId: $input->usuarioId,
                    );
                }

                $captura = $this->repositorio->guardar($input, $resultadoIA, $aplicados);

                $this->auditoria->registrarCapturaIA($captura, $resultadoIA, $ip, $userAgent);

                return $captura;
            });
        } catch (IdempotencyConflictException) {
            // Otra request con la misma clave ganó la carrera y ya hizo commit
            // mientras esta transacción corría; esta se revirtió por completo
            // (ningún producto/movimiento/captura de este intento quedó
            // escrito). Se recupera la que sí se aplicó.
            return $this->buscarPorIdempotencyKey($input->empresaId, $input->idempotencyKey)
                ?? throw new IdempotencyConflictException($input->empresaId, $input->idempotencyKey);
        }

        // afterCommit: el evento solo se dispara si la transacción completa
        // (producto + movimiento + stock + captura + audit log) fue exitosa
        // (sección 74, punto 6).
        DB::afterCommit(fn () => event(new AICaptureCompleted($captura)));

        return $captura;
    }

    /**
     * Expuesto para que el Controller pueda hacer el mismo chequeo ANTES de
     * guardar el archivo original (evita subidas duplicadas huérfanas en un
     * reintento, sección 74 punto 4) sin duplicar la consulta.
     */
    public function buscarPorIdempotencyKey(int $empresaId, string $idempotencyKey): ?CapturaIA
    {
        return CapturaIA::query()
            ->where('empresa_id', $empresaId)
            ->where('idempotency_key', $idempotencyKey)
            ->with('detalles')
            ->first();
    }

    /**
     * Aplica todo lo que quedó pendiente de revisión (o corregido) en una
     * captura, sin volver a evaluar el umbral de confianza: un humano ya
     * la revisó. Reutiliza ApplyInventoryMovementAction::aplicarConfirmado,
     * la misma vía de delegación a ProductService/InventoryService.
     */
    public function confirmar(CapturaIA $captura, ?int $usuarioId = null): CapturaIA
    {
        return DB::transaction(function () use ($captura, $usuarioId) {
            $tipoMovimiento = TipoMovimiento::tryFrom($captura->movimiento_tipo) ?? TipoMovimiento::Entrada;

            foreach ($captura->detalles as $detalle) {
                if (! in_array($detalle->estado, self::ESTADOS_EDITABLES, true)) {
                    continue;
                }

                $detectado = new DetectedProductDTO(
                    name: $detalle->nombre_detectado,
                    brand: $detalle->marca_detectado,
                    presentation: $detalle->presentacion_detectado,
                    category: $detalle->categoria_detectado,
                    quantity: (float) $detalle->cantidad_detectada,
                    unit: $detalle->unidad_detectado,
                    confidence: (float) $detalle->confianza,
                );

                $resultado = $this->aplicarMovimiento->aplicarConfirmado(
                    empresaId: $captura->empresa_id,
                    detectado: $detectado,
                    tipoMovimiento: $tipoMovimiento,
                    usuarioId: $usuarioId,
                );

                $detalle->update([
                    'producto_id' => $resultado->producto?->id,
                    'movimiento_id' => $resultado->movimiento?->id,
                    'es_producto_nuevo' => $resultado->esProductoNuevo,
                    'estado' => $resultado->estado,
                ]);
            }

            $captura->load('detalles');
            $captura->estado = EstadoCaptura::agregarDesde($captura->detalles->pluck('estado'));
            $captura->save();

            return $captura->fresh('detalles');
        });
    }

    /**
     * Descarta lo que seguía pendiente/corregido en una captura. No toca
     * productos ni movimientos: lo ya aplicado antes de descartar permanece.
     */
    public function descartar(CapturaIA $captura): CapturaIA
    {
        $captura->detalles()
            ->whereIn('estado', array_map(fn (EstadoCapturaDetalle $e) => $e->value, self::ESTADOS_EDITABLES))
            ->update(['estado' => EstadoCapturaDetalle::Descartado->value]);

        $captura->load('detalles');
        $captura->estado = EstadoCaptura::agregarDesde($captura->detalles->pluck('estado'));
        $captura->save();

        return $captura->fresh('detalles');
    }

    /**
     * Corrección manual de un detalle antes de confirmar (nombre, cantidad,
     * marca, etc.). No aplica nada por sí sola: el usuario debe llamar
     * después a confirmar() para que impacte inventario.
     *
     * @param array<string, mixed> $correcciones
     *
     * @throws CapturaIAEstadoInvalidoException si el detalle ya no es editable.
     */
    public function corregirDetalle(CapturaIADetalle $detalle, array $correcciones): CapturaIADetalle
    {
        if (! in_array($detalle->estado, self::ESTADOS_EDITABLES, true)) {
            throw new CapturaIAEstadoInvalidoException(
                "El detalle #{$detalle->id} ya no es editable (estado: {$detalle->estado->value})."
            );
        }

        $camposPermitidos = [
            'nombre_detectado', 'marca_detectado', 'categoria_detectado',
            'presentacion_detectado', 'unidad_detectado', 'cantidad_detectada',
        ];

        $detalle->fill(array_intersect_key($correcciones, array_flip($camposPermitidos)));
        $detalle->estado = EstadoCapturaDetalle::Corregido;
        $detalle->save();

        return $detalle;
    }
}
