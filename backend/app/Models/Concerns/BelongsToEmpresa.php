<?php

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use App\Services\Auth\TenantContext;

/**
 * Marca un modelo como propiedad de una empresa (docs/04_ARCHITECTURE.md,
 * Módulo 2 — Company Isolation):
 *
 * 1. Aplica `TenantScope` automáticamente a toda consulta.
 * 2. En `creating`, FUERZA `empresa_id` al de `TenantContext` — ignora
 *    cualquier valor que haya llegado por mass-assignment (payload
 *    manipulado). Si el contexto está bypasseado (Platform Super Admin),
 *    respeta el valor ya asignado al modelo.
 *
 * No declara la relación `empresa()`: cada modelo que lo use ya la define
 * por su cuenta (todos los modelos empresa-owned de este backend la tenían
 * desde antes de este módulo).
 */
trait BelongsToEmpresa
{
    public static function bootBelongsToEmpresa(): void
    {
        static::addGlobalScope(new TenantScope());

        static::creating(function ($model): void {
            $context = app(TenantContext::class);

            if ($context->isBypassed()) {
                return;
            }

            $model->empresa_id = $context->empresaId();
        });
    }
}
