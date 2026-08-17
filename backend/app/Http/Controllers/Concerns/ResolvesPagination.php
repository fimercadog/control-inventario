<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

/**
 * Paginación (Work Order "Paginación global para todas las tablas",
 * 2026-08-17). Único punto de lectura de `per_page` de todo el backend —
 * antes de esta unidad, cada controller de listado tenía un `paginate($n)`
 * hardcodeado y ningún endpoint leía `per_page` del request.
 *
 * `per_page` se restringe a una lista cerrada (no un rango numérico
 * cualquiera) — evita que un cliente pida `per_page=999999` y fuerce una
 * consulta de tabla completa disfrazada de "paginada". Los mismos 4
 * valores que expone `components/pagination.tsx` en el frontend — un
 * valor fuera de esa lista, o ausente, cae al default del endpoint.
 */
trait ResolvesPagination
{
    /** @var array<int> */
    private static array $perPagePermitidos = [10, 25, 50, 100];

    protected function perPageDeRequest(Request $request, int $porDefecto = 25): int
    {
        $solicitado = (int) $request->query('per_page', $porDefecto);

        return in_array($solicitado, self::$perPagePermitidos, true) ? $solicitado : $porDefecto;
    }

    /**
     * @param LengthAwarePaginator<int, \Illuminate\Database\Eloquent\Model> $paginador
     * @return array{current_page: int, per_page: int, total: int, last_page: int, from: int|null, to: int|null}
     */
    protected function metaDePaginacion(LengthAwarePaginator $paginador): array
    {
        return [
            'current_page' => $paginador->currentPage(),
            'per_page' => $paginador->perPage(),
            'total' => $paginador->total(),
            'last_page' => $paginador->lastPage(),
            'from' => $paginador->firstItem(),
            'to' => $paginador->lastItem(),
        ];
    }
}
