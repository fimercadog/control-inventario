<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Models\Producto;
use App\Reports\Concerns\AplicaPaginacion;

/** "Inventory by Category" — listado completo (sin tope de 10), a diferencia del dashboard. */
class InventarioPorCategoriaReporte implements Reporte
{
    use AplicaPaginacion;

    public function clave(): string
    {
        return 'inventario-por-categoria';
    }

    public function nombre(): string
    {
        return 'Inventario por Categoría';
    }

    public function descripcion(): string
    {
        return 'Cantidad de productos y valor de inventario agrupado por categoría.';
    }

    public function filtrosDisponibles(): array
    {
        return [];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $query = Producto::query()
            ->where('productos.estado', 'activo')
            ->join('categorias', 'categorias.id', '=', 'productos.categoria_id')
            ->selectRaw('categorias.id as categoria_id, categorias.nombre as categoria, COUNT(*) as total_productos, COALESCE(SUM(productos.stock_actual), 0) as stock_total, COALESCE(SUM(productos.stock_actual * productos.costo), 0) as valor_inventario')
            ->groupBy('categorias.id', 'categorias.nombre')
            ->orderByDesc('total_productos');

        ['filas' => $filas, 'total' => $total] = $this->paginarConsulta($query, $filtros, $paginado);

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: [
                ['clave' => 'categoria', 'etiqueta' => 'Categoría'],
                ['clave' => 'total_productos', 'etiqueta' => 'Productos'],
                ['clave' => 'stock_total', 'etiqueta' => 'Stock total'],
                ['clave' => 'valor_inventario', 'etiqueta' => 'Valor de inventario'],
            ],
            filas: array_map(fn ($f) => [
                'categoria' => $f->categoria,
                'total_productos' => (int) $f->total_productos,
                'stock_total' => (float) $f->stock_total,
                'valor_inventario' => (float) $f->valor_inventario,
            ], $filas),
            total: $total,
        );
    }
}
