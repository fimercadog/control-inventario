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
 *
 * `origen`/`tiene_evidencia` agregados 2026-08-03 (mejora de UX — la
 * lista mostraba solo "Salida -12.03" sin contexto, dando la falsa
 * impresión de que el inventario podía quedar negativo). Ninguno de los
 * dos es una columna real: `origen` se deriva de la convención ya
 * existente `documento === 'captura_ia'` (ver `ApplyInventoryMovementAction`)
 * — no existe un campo "Import" real en el sistema, así que ese origen
 * nunca aparece; `tiene_evidencia` se deriva de si existe una
 * `CapturaIADetalle` (y su `CapturaIA` padre) enlazada a este movimiento
 * con un archivo adjunto. Puramente de presentación — no cambia ninguna
 * regla de negocio.
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
            'bodega_id' => $this->bodega_id,
            'bodega' => $this->whenLoaded('bodega', fn () => $this->bodega?->nombre),
            'producto' => $this->whenLoaded('producto', fn () => $this->producto?->nombre),
            'producto_codigo' => $this->whenLoaded('producto', fn () => $this->producto?->codigo),
            'unidad_medida' => $this->whenLoaded('producto', fn () => $this->producto?->unidadMedida?->abreviatura),
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
            'origen' => $this->documento === 'captura_ia' ? 'captura_ia' : 'manual',
            // `whenLoaded()` no sirve aquí a propósito: su implementación
            // retorna null en cuanto la relación cargada ES null (el caso
            // normal — la mayoría de los movimientos no vienen de Captura
            // IA), sin siquiera invocar el callback — ver
            // ConditionallyLoadsAttributes::whenLoaded(). `tiene_evidencia`
            // necesita `false` real en ese caso, no null, así que se
            // verifica `relationLoaded()` directo.
            'tiene_evidencia' => $this->relationLoaded('capturaDetalle')
                && $this->capturaDetalle !== null
                && $this->capturaDetalle->captura?->archivo_path !== null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
