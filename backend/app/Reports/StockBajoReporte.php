<?php

namespace App\Reports;

/**
 * "Low Stock" — extiende `StockActualReporte` y agrega un único filtro
 * (`stock_actual <= stock_minimo`), en vez de duplicar la consulta y el
 * mapeo de filas completos.
 */
class StockBajoReporte extends StockActualReporte
{
    public function clave(): string
    {
        return 'stock-bajo';
    }

    public function nombre(): string
    {
        return 'Stock Bajo';
    }

    public function descripcion(): string
    {
        return 'Productos activos cuyo stock actual está en o por debajo del mínimo definido.';
    }

    protected function construirConsulta(array $filtros)
    {
        return parent::construirConsulta($filtros)->whereColumn('stock_actual', '<=', 'stock_minimo');
    }
}
