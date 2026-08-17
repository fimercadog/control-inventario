<?php

namespace App\Http\Resources\CapturaIA;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * El "id" público de una captura es su uuid, nunca el id numérico interno
 * (sección 74 del master spec, punto 6 — apps móviles e integraciones
 * externas usan el uuid).
 */
class CapturaIAResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'tipo' => $this->tipo->value,
            'estado' => $this->estado->value,
            'movement' => $this->movimiento_tipo,
            'proveedor' => $this->proveedor_ia,
            'tiempo_procesamiento_ms' => $this->tiempo_procesamiento_ms,
            'confianza_promedio' => (float) $this->confianza_promedio,
            'transcripcion' => $this->transcripcion,
            'products' => CapturaIADetalleResource::collection($this->whenLoaded('detalles')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
