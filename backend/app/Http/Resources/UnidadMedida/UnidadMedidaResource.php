<?php

namespace App\Http\Resources\UnidadMedida;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnidadMedidaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'abreviatura' => $this->abreviatura,
            'estado' => $this->estado,
            'productos_count' => $this->when(
                isset($this->productos_count),
                fn () => (int) $this->productos_count
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
