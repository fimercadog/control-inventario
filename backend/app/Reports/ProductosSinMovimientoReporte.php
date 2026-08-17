<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Models\Producto;
use App\Reports\Concerns\AplicaPaginacion;
use Carbon\Carbon;

/** "Products Without Movement" — productos activos sin ningún movimiento dentro del rango (o nunca, si no se filtra). */
class ProductosSinMovimientoReporte implements Reporte
{
    use AplicaPaginacion;
    use FiltersByEmpresa;

    public function clave(): string
    {
        return 'productos-sin-movimiento';
    }

    public function nombre(): string
    {
        return 'Productos sin Movimiento';
    }

    public function descripcion(): string
    {
        return 'Productos activos sin entradas, salidas ni ajustes registrados en el rango seleccionado.';
    }

    public function filtrosDisponibles(): array
    {
        return [
            ['clave' => 'desde', 'etiqueta' => 'Desde', 'tipo' => 'fecha', 'requerido' => false],
            ['clave' => 'hasta', 'etiqueta' => 'Hasta', 'tipo' => 'fecha', 'requerido' => false],
        ];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $hasta = isset($filtros['hasta']) ? Carbon::parse($filtros['hasta']) : Carbon::today();
        $desde = isset($filtros['desde']) ? Carbon::parse($filtros['desde']) : $hasta->copy()->subDays(89);

        $query = $this->paraEmpresaActual(Producto::query())
            ->where('estado', 'activo')
            ->with(['categoria:id,nombre'])
            ->whereDoesntHave('movimientos', function ($q) use ($desde, $hasta) {
                $q->whereBetween('created_at', [$desde->startOfDay(), $hasta->endOfDay()]);
            })
            ->orderBy('nombre');

        ['filas' => $productos, 'total' => $total] = $this->paginarConsulta($query, $filtros, $paginado);

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: [
                ['clave' => 'codigo', 'etiqueta' => 'Código'],
                ['clave' => 'nombre', 'etiqueta' => 'Producto'],
                ['clave' => 'categoria', 'etiqueta' => 'Categoría'],
                ['clave' => 'stock_actual', 'etiqueta' => 'Stock actual'],
            ],
            filas: array_map(fn (Producto $p) => [
                'codigo' => $p->codigo,
                'nombre' => $p->nombre,
                'categoria' => $p->categoria?->nombre ?? '—',
                'stock_actual' => (float) $p->stock_actual,
            ], $productos),
            filtrosAplicados: ['desde' => $desde->toDateString(), 'hasta' => $hasta->toDateString()],
            total: $total,
        );
    }
}
