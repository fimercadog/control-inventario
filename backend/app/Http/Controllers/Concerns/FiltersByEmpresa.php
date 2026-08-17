<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * ADR-019: reemplaza `EmpresaScope`/`EmpresaContext` (eliminados). No es un
 * Global Scope — no se aplica solo, cada Controller lo invoca explícitamente
 * en cada query/resolución de modelo. Misma semántica de seguridad que el
 * mecanismo anterior (fail-closed sin usuario resuelto, bypass solo para
 * `is_platform_admin`), verificada por la misma suite adversarial
 * (`EmpresaScopeTest`/`CompanyIsolationHttpTest`, ambas renombradas/adaptadas
 * en esta unidad, pero probando el mismo comportamiento observable).
 *
 * Trade-off aceptado explícitamente (ADR-019): no hay garantía estructural
 * de que un desarrollador (humano o agente) recuerde invocar este trait en
 * una query nueva — a diferencia del Global Scope anterior, olvidarlo aquí
 * no falla ruidosamente, simplemente no filtra. Mitigado por la suite
 * adversarial existente y por code review, no por el lenguaje.
 */
trait FiltersByEmpresa
{
    /**
     * `null` significa "sin filtro" — únicamente para Platform Super Admin.
     * Nunca lo uses para decidir si filtrar o no fuera de este trait: usa
     * siempre `paraEmpresaActual()`/`resolverParaEmpresaActual()`, que ya
     * codifican el caso fail-closed (usuario no resuelto → cero filas).
     */
    protected function empresaIdActual(): ?int
    {
        $user = auth('api')->user();

        return $user?->is_platform_admin ? null : $user?->empresa_id;
    }

    /**
     * @template TModel of Model
     * @param Builder<TModel> $query
     * @return Builder<TModel>
     */
    protected function paraEmpresaActual(Builder $query): Builder
    {
        $user = auth('api')->user();

        if ($user === null) {
            // Fail-closed: sin usuario autenticado resuelto, cero filas —
            // nunca todas. Mismo comportamiento que EmpresaScope sin
            // contexto (whereRaw('1 = 0')).
            return $query->whereRaw('1 = 0');
        }

        if ($user->is_platform_admin) {
            return $query; // Bypass intencional, por diseño (ADR-008/009).
        }

        return $query->where($query->getModel()->getTable().'.empresa_id', $user->empresa_id);
    }

    /**
     * Reemplazo explícito del route-model-binding automático: preserva el
     * comportamiento "404, no 403" en acceso cruzado entre empresas (no
     * revela si el registro existe en otra empresa) sin depender de un
     * Global Scope para lograrlo.
     *
     * `$columna` por defecto es `id` — pásale el `getRouteKeyName()` real
     * del modelo si no es la primary key (p. ej. `CapturaIA::uuid`).
     *
     * @template TModel of Model
     * @param class-string<TModel> $modelClass
     * @param int|string $valor
     * @return TModel
     */
    protected function resolverParaEmpresaActual(string $modelClass, int|string $valor, string $columna = 'id'): Model
    {
        return $this->paraEmpresaActual($modelClass::query())->where($columna, $valor)->firstOrFail();
    }
}
