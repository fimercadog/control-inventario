<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Models\Movimiento;
use App\Reports\Concerns\AplicaPaginacion;
use Carbon\Carbon;

/** "Inventory Movements" — listado completo de movimientos en el rango, no un agregado. */
class MovimientosInventarioReporte implements Reporte
{
    use AplicaPaginacion;
    use FiltersByEmpresa;

    public function clave(): string
    {
        return 'movimientos-inventario';
    }

    public function nombre(): string
    {
        return 'Movimientos de Inventario';
    }

    public function descripcion(): string
    {
        return 'Listado detallado de entradas, salidas y ajustes dentro de un rango de fechas.';
    }

    public function filtrosDisponibles(): array
    {
        return [
            ['clave' => 'desde', 'etiqueta' => 'Desde', 'tipo' => 'fecha', 'requerido' => false],
            ['clave' => 'hasta', 'etiqueta' => 'Hasta', 'tipo' => 'fecha', 'requerido' => false],
            ['clave' => 'producto_id', 'etiqueta' => 'Producto', 'tipo' => 'select', 'requerido' => false],
            ['clave' => 'tipo', 'etiqueta' => 'Tipo', 'tipo' => 'select', 'requerido' => false],
        ];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $hasta = isset($filtros['hasta']) ? Carbon::parse($filtros['hasta']) : Carbon::today();
        $desde = isset($filtros['desde']) ? Carbon::parse($filtros['desde']) : $hasta->copy()->subDays(29);

        $query = $this->paraEmpresaActual(Movimiento::query())
            ->with(['producto:id,nombre,codigo', 'usuario:id,name'])
            ->whereBetween('movimientos.created_at', [$desde->startOfDay(), $hasta->endOfDay()])
            ->when($filtros['producto_id'] ?? null, fn ($q, $v) => $q->where('producto_id', $v))
            ->when($filtros['tipo'] ?? null, fn ($q, $v) => $q->where('tipo', $v))
            ->latest('movimientos.created_at');

        ['filas' => $movimientos, 'total' => $total] = $this->paginarConsulta($query, $filtros, $paginado);

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: [
                ['clave' => 'fecha', 'etiqueta' => 'Fecha'],
                ['clave' => 'producto', 'etiqueta' => 'Producto'],
                ['clave' => 'tipo', 'etiqueta' => 'Tipo'],
                ['clave' => 'cantidad', 'etiqueta' => 'Cantidad'],
                ['clave' => 'stock_anterior', 'etiqueta' => 'Stock anterior'],
                ['clave' => 'stock_nuevo', 'etiqueta' => 'Stock nuevo'],
                ['clave' => 'documento', 'etiqueta' => 'Documento'],
                ['clave' => 'usuario', 'etiqueta' => 'Usuario'],
            ],
            filas: array_map(fn (Movimiento $m) => [
                'fecha' => $m->created_at->format('Y-m-d H:i'),
                'producto' => $m->producto?->nombre ?? '—',
                'tipo' => ucfirst($m->tipo),
                'cantidad' => (float) $m->cantidad,
                'stock_anterior' => (float) $m->stock_anterior,
                'stock_nuevo' => (float) $m->stock_nuevo,
                'documento' => $m->documento ?? '—',
                'usuario' => $m->usuario?->name ?? 'Sistema',
            ], $movimientos),
            filtrosAplicados: ['desde' => $desde->toDateString(), 'hasta' => $hasta->toDateString()] + $filtros,
            total: $total,
        );
    }
}
