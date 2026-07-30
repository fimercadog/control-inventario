<?php

namespace App\Http\Resources\ProductoProveedor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductoProveedorResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'producto_id' => $this->producto_id,
            'proveedor_id' => $this->proveedor_id,
            'proveedor_nombre' => $this->whenLoaded('proveedor', fn () => $this->proveedor?->nombre),
            'producto_nombre' => $this->whenLoaded('producto', fn () => $this->producto?->nombre),
            'es_principal' => (bool) $this->es_principal,
            'precio_compra' => $this->precio_compra !== null ? (float) $this->precio_compra : null,
            'codigo_proveedor' => $this->codigo_proveedor,
            'estado' => $this->estado,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
