<?php

namespace App\Reports\Concerns;

use Illuminate\Contracts\Database\Query\Builder as BuilderContract;

/**
 * Compartido por los 13 reportes (2026-08-03) — evita repetir la misma
 * lógica de "paginar para preview, traer todo para exportar" en cada
 * clase de reporte.
 */
trait AplicaPaginacion
{
    /** @var array<int> */
    private static array $porPaginaPermitidos = [10, 25, 50, 100];

    /**
     * Paginación unificada (Work Order "Paginación global", 2026-08-17):
     * lee `per_page`/`page`, el mismo par de nombres que ya usa el resto
     * del backend — antes era el único punto del proyecto con nombres
     * propios (`por_pagina`/`pagina`), sin razón de negocio real, solo
     * porque este trait se escribió antes de que existiera una convención
     * explícita. El `meta` de paginación (`current_page`/`last_page`/etc.)
     * se calcula en `ReporteController::preview()` a partir de `total`,
     * no acá — evita tocar los 13 reportes que desestructuran
     * `['filas' => ..., 'total' => ...]` de este método.
     *
     * @return array{filas: array<int, array<string, mixed>>, total: int}
     */
    protected function paginarConsulta(BuilderContract $query, array $filtros, bool $paginado): array
    {
        $total = $query->count();

        if (! $paginado) {
            return ['filas' => $query->get()->all(), 'total' => $total];
        }

        $porPaginaSolicitado = (int) ($filtros['per_page'] ?? 50);
        $porPagina = in_array($porPaginaSolicitado, self::$porPaginaPermitidos, true) ? $porPaginaSolicitado : 50;
        $pagina = max(1, (int) ($filtros['page'] ?? 1));

        return [
            'filas' => $query->forPage($pagina, $porPagina)->get()->all(),
            'total' => $total,
        ];
    }
}
