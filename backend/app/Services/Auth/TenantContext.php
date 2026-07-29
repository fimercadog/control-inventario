<?php

namespace App\Services\Auth;

/**
 * Única fuente de verdad de "qué empresa es esta request" (docs/04_ARCHITECTURE.md,
 * Módulo 2 — Company Isolation). `TenantScope` y el trait `BelongsToEmpresa`
 * leen de aquí, nunca directamente de `auth()->user()`.
 *
 * Dos formas de resolverse:
 * - Explícita (`setEmpresaId()`): la fija `IdentifyTenant` por request, o
 *   un Job/Artisan command que no tiene guard HTTP.
 * - Implícita (fallback): si nada la fijó explícitamente, recae en el
 *   usuario ya autenticado en el guard `api` — así un test con `actingAs()`
 *   (que salta toda la pipeline de middleware) sigue quedando protegido
 *   sin tener que acordarse de fijar el contexto a mano.
 *
 * Bind como singleton: vive una instancia por request/proceso.
 */
class TenantContext
{
    private ?int $empresaId = null;

    private bool $bypassed = false;

    private bool $explicitlySet = false;

    public function setEmpresaId(?int $empresaId): void
    {
        $this->empresaId = $empresaId;
        $this->explicitlySet = true;
    }

    /**
     * Si nada fijó el contexto explícitamente todavía (p. ej. un test que
     * usa `actingAs()`, que salta toda la pipeline de middleware —
     * `IdentifyTenant` nunca corre), recae en el guard autenticado
     * directamente. Esto evita que cada test tenga que acordarse de fijar
     * el contexto a mano — justamente el tipo de "olvido" que este módulo
     * existe para eliminar.
     */
    public function empresaId(): ?int
    {
        if ($this->explicitlySet) {
            return $this->empresaId;
        }

        return auth('api')->user()?->empresa_id;
    }

    /**
     * Solo para el Platform Super Admin (docs/04_ARCHITECTURE.md): omite
     * TenantScope por completo. Nunca se activa por defecto.
     */
    public function bypass(): void
    {
        $this->bypassed = true;
    }

    public function isBypassed(): bool
    {
        return $this->bypassed;
    }
}
