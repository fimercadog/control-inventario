<?php

namespace App\DTO\CapturaIA;

use App\DTO\AI\DetectedProductDTO;
use App\Enums\CapturaIA\EstadoCapturaDetalle;
use App\Models\Movimiento;
use App\Models\Producto;

/**
 * Resultado de intentar aplicar una detección: o quedó aplicada
 * (producto + movimiento reales, vía InventoryService), o quedó
 * pendiente de revisión por baja confianza (sección 74 del master spec).
 */
final readonly class AppliedDetectionResultDTO
{
    public function __construct(
        public DetectedProductDTO $detectado,
        public EstadoCapturaDetalle $estado,
        public bool $esProductoNuevo,
        public ?Producto $producto = null,
        public ?Movimiento $movimiento = null,
    ) {
    }
}
