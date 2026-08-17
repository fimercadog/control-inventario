<?php

namespace App\Http\Resources\CapturaIA;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Un elemento de "products" en la respuesta HTTP — mismo vocabulario que
 * el contrato de IA (name/brand/presentation/category/quantity/unit/
 * confidence), más los metadatos propios del ciclo de vida de la captura
 * (sección 74 del master spec, "Formato de respuesta").
 */
class CapturaIADetalleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->nombre_detectado,
            'brand' => $this->marca_detectado,
            'presentation' => $this->presentacion_detectado,
            'category' => $this->categoria_detectado,
            'quantity' => (float) $this->cantidad_detectada,
            'unit' => $this->unidad_detectado,
            'confidence' => (float) $this->confianza,
            'es_producto_nuevo' => (bool) $this->es_producto_nuevo,
            'producto_id' => $this->producto_id,
            'movimiento_id' => $this->movimiento_id,
            'estado' => $this->estado->value,
        ];
    }
}
