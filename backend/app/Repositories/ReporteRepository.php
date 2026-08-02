<?php

namespace App\Repositories;

use App\Models\Cliente;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\ProductoProveedor;
use App\Models\Proveedor;

/**
 * Reportes (2026-08-02). Estadísticas agregadas de solo lectura sobre
 * Productos/Inventario/Movimientos/Clientes/Proveedores — sin tabla ni
 * Model propio, "Reportes" es una vista computada sobre datos que ya
 * existen, mismo espíritu que Stock es una vista sobre `Producto`.
 * `TenantScope` (ya existente en los 5 modelos fuente) aísla cada
 * consulta por empresa automáticamente — este Repository nunca filtra
 * `empresa_id` a mano.
 */
class ReporteRepository
{
    public function resumenInventario(): array
    {
        $activos = fn () => Producto::query()->where('estado', 'activo');

        return [
            'total_productos' => $activos()->count(),
            'valor_total_inventario' => (float) $activos()
                ->selectRaw('COALESCE(SUM(stock_actual * costo), 0) as total')
                ->value('total'),
            'productos_stock_bajo' => $activos()->whereColumn('stock_actual', '<=', 'stock_minimo')->count(),
            'productos_sin_stock' => $activos()->where('stock_actual', '<=', 0)->count(),
            // `categoria_id` incluido a propósito: dos categorías distintas
            // pueden compartir nombre, y el frontend necesita una key de
            // React realmente única, no el nombre para mostrar.
            'productos_por_categoria' => Producto::query()
                ->where('productos.estado', 'activo')
                ->join('categorias', 'categorias.id', '=', 'productos.categoria_id')
                ->selectRaw('categorias.id as categoria_id, categorias.nombre as categoria, COUNT(*) as total')
                ->groupBy('categorias.id', 'categorias.nombre')
                ->orderByDesc('total')
                ->limit(10)
                ->get(),
        ];
    }

    /**
     * @return array{entradas: array, salidas: array, ajustes: array, por_dia: array, productos_mas_movidos: \Illuminate\Support\Collection}
     */
    public function resumenMovimientos(string $desde, string $hasta): array
    {
        $enRango = fn () => Movimiento::query()->whereBetween('movimientos.created_at', ["{$desde} 00:00:00", "{$hasta} 23:59:59"]);

        $porTipo = $enRango()
            ->selectRaw('tipo, COUNT(*) as total, COALESCE(SUM(cantidad), 0) as cantidad_total')
            ->groupBy('tipo')
            ->get()
            ->keyBy('tipo');

        $porDia = [];
        foreach ($enRango()->selectRaw('DATE(movimientos.created_at) as fecha, tipo, COUNT(*) as total')->groupBy('fecha', 'tipo')->orderBy('fecha')->get() as $fila) {
            $porDia[$fila->fecha] ??= ['fecha' => $fila->fecha, 'entradas' => 0, 'salidas' => 0, 'ajustes' => 0];
            $clave = match ($fila->tipo) {
                'entrada' => 'entradas',
                'salida' => 'salidas',
                default => 'ajustes',
            };
            $porDia[$fila->fecha][$clave] = (int) $fila->total;
        }

        $extraerTipo = fn (string $tipo) => [
            'total' => (int) ($porTipo[$tipo]->total ?? 0),
            'cantidad' => (float) ($porTipo[$tipo]->cantidad_total ?? 0),
        ];

        return [
            'entradas' => $extraerTipo('entrada'),
            'salidas' => $extraerTipo('salida'),
            'ajustes' => $extraerTipo('ajuste'),
            'por_dia' => array_values($porDia),
            // `producto_id` incluido a propósito: encontrado en verificación
            // de navegador que dos productos demo distintos pueden compartir
            // el mismo `nombre` — el frontend necesita una key de React
            // realmente única para no colisionar entre ambos.
            'productos_mas_movidos' => $enRango()
                ->join('productos', 'productos.id', '=', 'movimientos.producto_id')
                ->selectRaw('productos.id as producto_id, productos.nombre as producto, COUNT(*) as total_movimientos, COALESCE(SUM(movimientos.cantidad), 0) as cantidad_total')
                ->groupBy('productos.id', 'productos.nombre')
                ->orderByDesc('total_movimientos')
                ->limit(10)
                ->get(),
        ];
    }

    public function resumenClientes(): array
    {
        return [
            'total_activos' => Cliente::query()->where('estado', 'activo')->count(),
            'total_inactivos' => Cliente::query()->where('estado', 'inactivo')->count(),
            'nuevos_ultimos_30_dias' => Cliente::query()->where('created_at', '>=', now()->subDays(30))->count(),
        ];
    }

    public function resumenProveedores(): array
    {
        return [
            'total_activos' => Proveedor::query()->where('estado', 'activo')->count(),
            'total_inactivos' => Proveedor::query()->where('estado', 'inactivo')->count(),
            'top_proveedores' => ProductoProveedor::query()
                ->where('producto_proveedor.estado', 'activo')
                ->join('proveedores', 'proveedores.id', '=', 'producto_proveedor.proveedor_id')
                ->selectRaw('proveedores.id as proveedor_id, proveedores.nombre as proveedor, COUNT(*) as total_productos')
                ->groupBy('proveedores.id', 'proveedores.nombre')
                ->orderByDesc('total_productos')
                ->limit(10)
                ->get(),
        ];
    }
}
