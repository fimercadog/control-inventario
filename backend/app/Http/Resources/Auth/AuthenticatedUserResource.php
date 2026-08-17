<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * Forma de /auth/me y del body de login/refresh. `permissions` se calcula
 * una vez aquí (nunca en el frontend) para que Sidebar/PermissionContext
 * solo lean un arreglo de strings, sin conocer roles.
 */
class AuthenticatedUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'empresa_id' => $this->empresa_id,
            // Módulo Perfil (2026-08-02, docs/03_FUNCTIONAL_SPEC/Profile.md)
            // — el propio "auth/me" ya es la fuente de verdad de la ficha
            // del usuario; no se creó un GET /perfil redundante.
            'empresa' => $this->empresa ? ['id' => $this->empresa->id, 'nombre' => $this->empresa->nombre] : null,
            'is_platform_admin' => $this->is_platform_admin,
            'avatar_path' => $this->avatar_path,
            'avatar_url' => $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null,
            'theme' => $this->theme,
            'language' => $this->language,
            'timezone' => $this->timezone,
            'role' => $this->getRoleNames()->first(),
            'roles' => $this->getRoleNames()->values(),
            'permissions' => $this->getAllPermissions()->pluck('name')->values(),
        ];
    }
}
