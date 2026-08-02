<?php

namespace App\Http\Resources\Audit;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Auditoría (2026-08-02). Regla de privacidad no negociable, confirmada
 * por el propietario del proyecto y documentada en
 * docs/03_FUNCTIONAL_SPEC/Auditoria.md: un registro de auditoría nunca
 * expone el nombre real de una persona — solo el email de la cuenta y
 * su(s) rol(es) asignados. `usuario.name` NUNCA debe agregarse aquí,
 * bajo ninguna circunstancia.
 */
class AuditLogResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'modulo' => $this->modulo,
            'accion' => $this->accion,
            'auditable_type' => $this->auditable_type,
            'auditable_id' => $this->auditable_id,
            'valores_anteriores' => $this->valores_anteriores,
            'valores_nuevos' => $this->valores_nuevos,
            'resultado' => $this->resultado,
            'ip' => $this->ip,
            'user_agent' => $this->user_agent,
            'usuario' => $this->whenLoaded('usuario', fn () => $this->usuario === null ? null : [
                'id' => $this->usuario->id,
                'email' => $this->usuario->email,
                'roles' => $this->usuario->roles->pluck('name')->values(),
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
