<?php

namespace App\Models\Scopes;

use App\Services\Auth\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * Aplica `WHERE empresa_id = <empresa del contexto actual>` a TODA consulta
 * de un modelo `empresa_id`-scoped, automáticamente — ningún desarrollador
 * necesita recordar agregarlo (docs/04_ARCHITECTURE.md, "Company Isolation").
 *
 * Fail-closed por diseño: si el contexto todavía no tiene una empresa
 * resuelta (p. ej. un código que consulta el modelo antes de que
 * `IdentifyTenant` corra, o un test que no la fijó), la consulta devuelve
 * CERO filas — nunca "todas las filas". Ver `withoutTenant()` para el
 * único escape intencional (Platform Super Admin).
 */
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $context = app(TenantContext::class);

        if ($context->isBypassed()) {
            return;
        }

        $empresaId = $context->empresaId();

        if ($empresaId === null) {
            $builder->whereRaw('1 = 0');

            return;
        }

        $builder->where($model->getTable().'.empresa_id', $empresaId);
    }
}
