<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Repositories\ReporteRepository;

/**
 * "Inventory Summary" — reutiliza `ReporteRepository::resumenInventario()`
 * (ya construido para el dashboard) en vez de recalcular los mismos
 * agregados; solo los reformatea como filas exportables.
 */
class InventarioResumenReporte implements Reporte
{
    public function __construct(
        private readonly ReporteRepository $reportes,
    ) {}

    public function clave(): string
    {
        return 'inventario-resumen';
    }

    public function nombre(): string
    {
        return 'Resumen de Inventario';
    }

    public function descripcion(): string
    {
        return 'Indicadores clave del inventario actual: productos activos, valor total, stock bajo y sin stock.';
    }

    public function filtrosDisponibles(): array
    {
        return [];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $resumen = $this->reportes->resumenInventario();

        $filas = [
            ['metrica' => 'Productos activos', 'valor' => $resumen['total_productos']],
            ['metrica' => 'Valor total de inventario', 'valor' => $resumen['valor_total_inventario']],
            ['metrica' => 'Productos con stock bajo', 'valor' => $resumen['productos_stock_bajo']],
            ['metrica' => 'Productos sin stock', 'valor' => $resumen['productos_sin_stock']],
        ];

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: [
                ['clave' => 'metrica', 'etiqueta' => 'Métrica'],
                ['clave' => 'valor', 'etiqueta' => 'Valor'],
            ],
            filas: $filas,
            resumen: ['productos_por_categoria' => $resumen['productos_por_categoria']],
            total: count($filas),
        );
    }
}
