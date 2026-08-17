<?php

namespace App\Actions\CapturaIA;

use App\DTO\AI\DetectedProductDTO;
use App\DTO\CapturaIA\AppliedDetectionResultDTO;
use App\Enums\CapturaIA\EstadoCapturaDetalle;
use App\Enums\TipoMovimiento;
use App\Models\Producto;
use App\Services\InventoryService;
use App\Services\ProductService;

/**
 * Único punto donde Captura IA decide si una detección se aplica o queda
 * pendiente de revisión, según el umbral de confianza — la única regla que
 * le pertenece a Captura IA (qué tanto confiar en la IA). Todo lo demás
 * (encontrar el producto, crearlo, mover el stock) es una llamada directa
 * a ProductService/InventoryService: esta clase no reimplementa ninguna
 * de esas reglas (sección 74 del master spec, "Captura IA nunca contiene
 * reglas de negocio").
 */
class ApplyInventoryMovementAction
{
    public function __construct(
        private readonly ProductService $productos,
        private readonly InventoryService $inventario,
    ) {
    }

    /**
     * Ruta automática: aplica solo si la confianza supera el umbral.
     */
    public function __invoke(
        int $empresaId,
        DetectedProductDTO $detectado,
        TipoMovimiento $tipoMovimiento,
        ?int $usuarioId = null,
    ): AppliedDetectionResultDTO {
        [$productoExistente, $esProductoNuevo] = $this->resolverProducto($empresaId, $detectado);

        // Cierre del módulo (2026-08-11, Fase 7 — "no confiar ciegamente en
        // la respuesta IA"): el esquema strict exige la clave `name`, pero
        // no que tenga contenido — un proveedor puede devolverla vacía con
        // confidence alta. Sin este chequeo, se creaba un producto sin
        // nombre en el catálogo real (encontrado con test reproducible
        // durante este cierre). Solo aplica cuando se crearía un producto
        // nuevo — uno ya existente en el catálogo real ya tiene nombre, por
        // definición. Se trata igual que confianza baja: queda
        // pendiente_revision, nunca se aplica automáticamente.
        if ($pendiente = $this->pendientePorNombreVacio($detectado, $esProductoNuevo, $productoExistente)) {
            return $pendiente;
        }

        $umbral = (float) config('captura_ia.confidence_threshold');

        if ($detectado->confidence < $umbral) {
            return new AppliedDetectionResultDTO(
                detectado: $detectado,
                estado: EstadoCapturaDetalle::PendienteRevision,
                esProductoNuevo: $esProductoNuevo,
                producto: $productoExistente,
            );
        }

        return $this->aplicar($empresaId, $detectado, $productoExistente, $esProductoNuevo, $tipoMovimiento, $usuarioId);
    }

    /**
     * Ruta de confirmación manual: un humano ya revisó la detección
     * pendiente (endpoint POST .../{id}/confirmar), así que se aplica sin
     * volver a evaluar el umbral de confianza.
     *
     * La única excepción es el mismo chequeo de nombre vacío que
     * `__invoke()` — no es una revalidación del umbral de confianza (regla
     * de negocio que sí queda congelada tras revisión humana), es una
     * garantía de integridad de datos: nunca crear un producto sin nombre,
     * ni siquiera si el usuario confirmó todo sin corregir este detalle
     * puntual (2026-08-11).
     */
    public function aplicarConfirmado(
        int $empresaId,
        DetectedProductDTO $detectado,
        TipoMovimiento $tipoMovimiento,
        ?int $usuarioId = null,
    ): AppliedDetectionResultDTO {
        [$productoExistente, $esProductoNuevo] = $this->resolverProducto($empresaId, $detectado);

        if ($pendiente = $this->pendientePorNombreVacio($detectado, $esProductoNuevo, $productoExistente)) {
            return $pendiente;
        }

        return $this->aplicar(
            $empresaId,
            $detectado,
            $productoExistente,
            $esProductoNuevo,
            $tipoMovimiento,
            $usuarioId,
        );
    }

    /**
     * @return array{0: ?Producto, 1: bool}
     */
    private function resolverProducto(int $empresaId, DetectedProductDTO $detectado): array
    {
        $productoExistente = $this->productos->buscarCoincidencia(
            empresaId: $empresaId,
            nombre: $detectado->name,
            marca: $detectado->brand,
            presentacion: $detectado->presentation,
        );

        return [$productoExistente, $productoExistente === null];
    }

    private function pendientePorNombreVacio(
        DetectedProductDTO $detectado,
        bool $esProductoNuevo,
        ?Producto $productoExistente,
    ): ?AppliedDetectionResultDTO {
        if (! $esProductoNuevo || trim($detectado->name) !== '') {
            return null;
        }

        return new AppliedDetectionResultDTO(
            detectado: $detectado,
            estado: EstadoCapturaDetalle::PendienteRevision,
            esProductoNuevo: $esProductoNuevo,
            producto: $productoExistente,
        );
    }

    private function aplicar(
        int $empresaId,
        DetectedProductDTO $detectado,
        ?Producto $productoExistente,
        bool $esProductoNuevo,
        TipoMovimiento $tipoMovimiento,
        ?int $usuarioId,
    ): AppliedDetectionResultDTO {
        $producto = $productoExistente ?? $this->productos->crear([
            'empresa_id' => $empresaId,
            'nombre' => $detectado->name,
            'marca' => $detectado->brand,
            'presentacion' => $detectado->presentation,
            'unidad_medida' => $detectado->unit,
        ]);

        $movimiento = $this->inventario->registrarMovimiento(
            producto: $producto,
            tipo: $tipoMovimiento,
            cantidad: $detectado->quantity,
            documento: 'captura_ia',
            observacion: 'Generado por Captura IA',
            usuarioId: $usuarioId,
        );

        // InventoryService opera sobre una copia bloqueada (lockForUpdate) del
        // producto, no sobre esta instancia: hay que refrescarla para que el
        // stock_actual devuelto aquí sea el real, no el de antes del movimiento.
        $producto->refresh();

        return new AppliedDetectionResultDTO(
            detectado: $detectado,
            estado: EstadoCapturaDetalle::Aplicado,
            esProductoNuevo: $esProductoNuevo,
            producto: $producto,
            movimiento: $movimiento,
        );
    }
}
