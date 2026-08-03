<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Models\ProductoProveedor;
use App\Reports\Concerns\AplicaPaginacion;

/** "Inventory by Supplier" — vía la asociación ProductoProveedor, solo activas. */
class InventarioPorProveedorReporte implements Reporte
{
    use AplicaPaginacion;

    public function clave(): string
    {
        return 'inventario-por-proveedor';
    }

    public function nombre(): string
    {
        return 'Inventario por Proveedor';
    }

    public function descripcion(): string
    {
        return 'Cantidad de productos asociados y valor de inventario por proveedor.';
    }

    public function filtrosDisponibles(): array
    {
        return [];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $query = ProductoProveedor::query()
            ->where('producto_proveedor.estado', 'activo')
            ->join('proveedores', 'proveedores.id', '=', 'producto_proveedor.proveedor_id')
            ->join('productos', 'productos.id', '=', 'producto_proveedor.producto_id')
            ->selectRaw('proveedores.id as proveedor_id, proveedores.nombre as proveedor, COUNT(*) as total_productos, COALESCE(SUM(productos.stock_actual * productos.costo), 0) as valor_inventario')
            ->groupBy('proveedores.id', 'proveedores.nombre')
            ->orderByDesc('total_productos');

        ['filas' => $filas, 'total' => $total] = $this->paginarConsulta($query, $filtros, $paginado);

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: [
                ['clave' => 'proveedor', 'etiqueta' => 'Proveedor'],
                ['clave' => 'total_productos', 'etiqueta' => 'Productos asociados'],
                ['clave' => 'valor_inventario', 'etiqueta' => 'Valor de inventario asociado'],
            ],
            filas: array_map(fn ($f) => [
                'proveedor' => $f->proveedor,
                'total_productos' => (int) $f->total_productos,
                'valor_inventario' => (float) $f->valor_inventario,
            ], $filas),
            total: $total,
        );
    }
}
