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
    /**
     * @return array{filas: array<int, array<string, mixed>>, total: int}
     */
    protected function paginarConsulta(BuilderContract $query, array $filtros, bool $paginado): array
    {
        $total = $query->count();

        if (! $paginado) {
            return ['filas' => $query->get()->all(), 'total' => $total];
        }

        $porPagina = max(1, (int) ($filtros['por_pagina'] ?? 50));
        $pagina = max(1, (int) ($filtros['pagina'] ?? 1));

        return [
            'filas' => $query->forPage($pagina, $porPagina)->get()->all(),
            'total' => $total,
        ];
    }
}
