<?php

namespace App\Http\Resources\Movimiento;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Vista embebida de solo lectura para la sección "Movimientos" de la ficha
 * de producto (docs/03_FUNCTIONAL_SPEC/Products.md, adenda). No es el
 * módulo Kardex — ese sigue en docs/03_FUNCTIONAL_SPEC/FUTURE/Kardex.md,
 * sin construir.
 */
class MovimientoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tipo' => $this->tipo,
            'cantidad' => (float) $this->cantidad,
            'stock_anterior' => (float) $this->stock_anterior,
            'stock_nuevo' => (float) $this->stock_nuevo,
            'documento' => $this->documento,
            'observacion' => $this->observacion,
            'proveedor' => $this->proveedor,
            'proveedor_id' => $this->proveedor_id,
            'lote' => $this->lote,
            'vencimiento' => $this->vencimiento?->toDateString(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
