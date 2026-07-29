<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

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
            'is_platform_admin' => $this->is_platform_admin,
            'avatar_path' => $this->avatar_path,
            'theme' => $this->theme,
            'language' => $this->language,
            'timezone' => $this->timezone,
            'permissions' => $this->getAllPermissions()->pluck('name')->values(),
        ];
    }
}
