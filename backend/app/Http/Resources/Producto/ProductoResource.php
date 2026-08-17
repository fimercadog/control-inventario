<?php

namespace App\Http\Resources\Producto;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo' => $this->codigo,
            'codigo_barras' => $this->codigo_barras,
            'nombre' => $this->nombre,
            'marca_id' => $this->marca_id,
            'marca' => $this->whenLoaded('marca', fn () => $this->marca?->nombre),
            'descripcion' => $this->descripcion,
            'presentacion' => $this->presentacion,
            'categoria_id' => $this->categoria_id,
            'categoria' => $this->whenLoaded('categoria', fn () => $this->categoria?->nombre),
            'costo' => (float) $this->costo,
            'precio' => (float) $this->precio,
            'unidad_medida_id' => $this->unidad_medida_id,
            'unidad_medida' => $this->whenLoaded('unidadMedida', fn () => $this->unidadMedida?->nombre),
            'stock_actual' => (float) $this->stock_actual,
            'stock_minimo' => (float) $this->stock_minimo,
            'stock_maximo' => $this->stock_maximo !== null ? (float) $this->stock_maximo : null,
            'imagen' => $this->imagen,
            'estado' => $this->estado,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
