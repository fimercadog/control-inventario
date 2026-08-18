<?php

namespace App\Http\Resources\Stock;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * RC1 Fase 2 (docs/03_FUNCTIONAL_SPEC/Stock.md). Stock NO es una entidad
 * independiente — este Resource es una vista sobre los campos de stock
 * que ya viven en `Producto` (`stock_actual`/`stock_minimo`/
 * `stock_maximo`/`stock_estado`). `estado` (catálogo) y `stock_estado`
 * (administrativo, propio de este módulo) son campos deliberadamente
 * distintos y nunca se confunden.
 */
class StockResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'nombre' => $this->nombre,
            'categoria' => $this->whenLoaded('categoria', fn () => $this->categoria?->nombre),
            'marca' => $this->whenLoaded('marca', fn () => $this->marca?->nombre),
            'unidad_medida' => $this->whenLoaded('unidadMedida', fn () => $this->unidadMedida?->nombre),
            'stock_actual' => (float) $this->stock_actual,
            'stock_minimo' => (float) $this->stock_minimo,
            'stock_maximo' => $this->stock_maximo !== null ? (float) $this->stock_maximo : null,
            'bajo_minimo' => (float) $this->stock_actual < (float) $this->stock_minimo,
            'estado' => $this->stock_estado,
            'producto_estado' => $this->estado,
            'inhabilitado_por_stock' => (bool) $this->inhabilitado_por_stock,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
