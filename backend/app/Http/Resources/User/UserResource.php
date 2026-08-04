<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md). Vista de solo lectura de
 * un usuario dentro del módulo administrativo Usuarios — distinta de
 * `AuthenticatedUserResource` (forma de /auth/me, siempre sobre el propio
 * usuario autenticado). `role` usa `getRoleNames()` igual que esa, ya
 * probado contra el team context de Spatie fijado por `IdentifyTenant`.
 *
 * `empresa`/`is_platform_admin`/`avatar_url`/`theme`/`language`/`timezone`
 * agregados 2026-08-04 (ADR-015) para el modal "Editar" administrativo —
 * los primeros dos como campos de identidad de solo lectura, los últimos
 * cuatro porque un administrador con `usuarios.editar` ahora puede
 * modificarlos para otro usuario de su empresa (antes solo autoservicio
 * vía Perfil — ver la nota de reversión en `docs/03_FUNCTIONAL_SPEC/Profile.md`).
 */
class UserResource extends JsonResource
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
            'empresa' => $this->whenLoaded('empresa', fn () => $this->empresa ? ['id' => $this->empresa->id, 'nombre' => $this->empresa->nombre] : null),
            'is_platform_admin' => (bool) $this->is_platform_admin,
            'is_active' => (bool) $this->is_active,
            'avatar_path' => $this->avatar_path,
            'avatar_url' => $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null,
            'theme' => $this->theme,
            'language' => $this->language,
            'timezone' => $this->timezone,
            'role' => $this->getRoleNames()->first(),
            'last_activity_at' => $this->last_activity_at?->toIso8601String(),
            'last_login_ip' => $this->last_login_ip,
            'last_user_agent' => $this->last_user_agent,
            'invited_at' => $this->invited_at?->toIso8601String(),
            'invited_by' => $this->whenLoaded('invitedBy', fn () => $this->invitedBy?->name),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
