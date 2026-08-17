<?php

namespace App\Models\Concerns;

/**
 * Marca un modelo como propiedad de una empresa (docs/04_ARCHITECTURE.md,
 * Módulo 2 — Company Isolation).
 *
 * ADR-019: ya no aplica ningún Global Scope automático (`EmpresaScope`,
 * eliminado) — el filtrado por empresa en listados/resoluciones es
 * responsabilidad explícita de cada Controller/Repository/Reporte, vía
 * `App\Http\Controllers\Concerns\FiltersByEmpresa`.
 *
 * Lo único que este trait sigue haciendo: en `creating`, FUERZA
 * `empresa_id` al de la empresa del usuario autenticado — ignora cualquier
 * valor que haya llegado por mass-assignment (payload manipulado). Sin
 * usuario autenticado resuelto (seeder/Artisan/consola) o para un Platform
 * Super Admin, respeta el valor ya asignado al modelo (si lo hay).
 *
 * No declara la relación `empresa()`: cada modelo que lo use ya la define
 * por su cuenta (todos los modelos empresa-owned de este backend la tenían
 * desde antes de este módulo).
 */
trait BelongsToEmpresa
{
    public static function bootBelongsToEmpresa(): void
    {
        static::creating(function ($model): void {
            $user = auth('api')->user();

            if ($user === null || $user->is_platform_admin) {
                return;
            }

            $model->empresa_id = $user->empresa_id;
        });
    }
}
