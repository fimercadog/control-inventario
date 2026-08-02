<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md). Vista de solo lectura de
 * un usuario dentro del módulo administrativo Usuarios — distinta de
 * `AuthenticatedUserResource` (forma de /auth/me, siempre sobre el propio
 * usuario autenticado). `role` usa `getRoleNames()` igual que esa, ya
 * probado contra el team context de Spatie fijado por `IdentifyTenant`.
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
            'is_active' => (bool) $this->is_active,
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
