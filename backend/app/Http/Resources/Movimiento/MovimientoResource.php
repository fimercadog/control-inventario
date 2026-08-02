<?php

namespace App\Http\Resources\Movimiento;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Vista de solo lectura de un movimiento — usada tanto embebida en la
 * sección "Movimientos" de la Ficha de Producto (docs/03_FUNCTIONAL_SPEC/Products.md,
 * adenda) como en el módulo global Movimientos (RC1 Fase 3,
 * docs/03_FUNCTIONAL_SPEC/Movements.md). No es el módulo Kardex — ese
 * sigue en docs/03_FUNCTIONAL_SPEC/FUTURE/Kardex.md, sin construir.
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
            'producto_id' => $this->producto_id,
            'producto' => $this->whenLoaded('producto', fn () => $this->producto?->nombre),
            'producto_codigo' => $this->whenLoaded('producto', fn () => $this->producto?->codigo),
            'usuario' => $this->whenLoaded('usuario', fn () => $this->usuario?->name),
            'cantidad' => (float) $this->cantidad,
            // Delta con signo (stock_nuevo - stock_anterior) — correcto de
            // forma uniforme para todos los tipos, incluyendo un Ajuste
            // negativo, sin tener que re-derivar el signo desde `tipo`.
            'delta' => (float) $this->stock_nuevo - (float) $this->stock_anterior,
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
