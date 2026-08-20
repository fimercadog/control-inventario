<?php

namespace App\Http\Resources\CapturaIA;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CapturaCrmIAResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->uuid, 'entidad' => $this->entidad, 'contenido_original' => $this->contenido_original, 'propuesta' => $this->propuesta_ia, 'proveedor' => $this->proveedor_ia, 'confianza' => (float) $this->confianza, 'estado' => $this->estado, 'created_at' => $this->created_at?->toIso8601String()];
    }
}
