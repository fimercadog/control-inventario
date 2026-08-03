<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Models\Producto;
use App\Reports\Concerns\AplicaPaginacion;

/** "Inventory by Brand" — mismo shape que InventarioPorCategoriaReporte, agrupado por marca. */
class InventarioPorMarcaReporte implements Reporte
{
    use AplicaPaginacion;

    public function clave(): string
    {
        return 'inventario-por-marca';
    }

    public function nombre(): string
    {
        return 'Inventario por Marca';
    }

    public function descripcion(): string
    {
        return 'Cantidad de productos y valor de inventario agrupado por marca.';
    }

    public function filtrosDisponibles(): array
    {
        return [];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $query = Producto::query()
            ->where('productos.estado', 'activo')
            ->join('marcas', 'marcas.id', '=', 'productos.marca_id')
            ->selectRaw('marcas.id as marca_id, marcas.nombre as marca, COUNT(*) as total_productos, COALESCE(SUM(productos.stock_actual), 0) as stock_total, COALESCE(SUM(productos.stock_actual * productos.costo), 0) as valor_inventario')
            ->groupBy('marcas.id', 'marcas.nombre')
            ->orderByDesc('total_productos');

        ['filas' => $filas, 'total' => $total] = $this->paginarConsulta($query, $filtros, $paginado);

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: [
                ['clave' => 'marca', 'etiqueta' => 'Marca'],
                ['clave' => 'total_productos', 'etiqueta' => 'Productos'],
                ['clave' => 'stock_total', 'etiqueta' => 'Stock total'],
                ['clave' => 'valor_inventario', 'etiqueta' => 'Valor de inventario'],
            ],
            filas: array_map(fn ($f) => [
                'marca' => $f->marca,
                'total_productos' => (int) $f->total_productos,
                'stock_total' => (float) $f->stock_total,
                'valor_inventario' => (float) $f->valor_inventario,
            ], $filas),
            total: $total,
        );
    }
}
