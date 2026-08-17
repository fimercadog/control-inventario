<?php

namespace App\Http\Resources\Role;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'estado' => $this->estado,
            'permisos' => $this->when(
                $this->relationLoaded('permissions'),
                fn () => $this->permissions->pluck('name')->values()
            ),
            'permisos_count' => $this->when(
                isset($this->permissions_count),
                fn () => $this->permissions_count
            ),
            'usuarios_count' => $this->when(
                isset($this->usuarios_count),
                fn () => $this->usuarios_count
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
