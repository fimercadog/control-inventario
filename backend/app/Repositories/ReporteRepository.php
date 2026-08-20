<?php

namespace App\Repositories;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Models\Cliente;
use App\Models\Contacto;
use App\Models\Oportunidad;
use App\Models\Actividad;
use App\Models\Automatizacion;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\ProductoProveedor;
use App\Models\Proveedor;
use App\Models\ReporteHistorial;
use App\Models\ReporteProgramado;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Reportes (2026-08-02, ampliado 2026-08-03 a centro de reportes
 * completo). Los métodos `resumen*` siguen siendo estadísticas agregadas
 * de solo lectura sobre Productos/Inventario/Movimientos/Clientes/
 * Proveedores para el dashboard — sin tabla ni Model propio. Los métodos
 * `historial*`/`*Programado*` sí tienen modelo propio (`ReporteHistorial`,
 * `ReporteProgramado`, nuevos en esta ampliación). ADR-019: cada consulta
 * se filtra explícitamente por empresa (`FiltersByEmpresa`) — ya no vía
 * `EmpresaScope` automático (eliminado).
 */
class ReporteRepository
{
    use FiltersByEmpresa;

    public function resumenInventario(): array
    {
        $activos = fn () => $this->paraEmpresaActual(Producto::query())->where('estado', 'activo');

        return [
            'total_productos' => $activos()->count(),
            // Cantidad, no valor monetario — distinto de
            // `valor_total_inventario` (usado por el Dashboard como "Stock
            // total", agregado 2026-08-11 para el cierre de ese módulo).
            'total_stock' => (float) $activos()->sum('stock_actual'),
            'valor_total_inventario' => (float) $activos()
                ->selectRaw('COALESCE(SUM(stock_actual * costo), 0) as total')
                ->value('total'),
            'productos_stock_bajo' => $activos()->whereColumn('stock_actual', '<=', 'stock_minimo')->count(),
            'productos_sin_stock' => $activos()->where('stock_actual', '<=', 0)->count(),
            // `categoria_id` incluido a propósito: dos categorías distintas
            // pueden compartir nombre, y el frontend necesita una key de
            // React realmente única, no el nombre para mostrar.
            'productos_por_categoria' => $this->paraEmpresaActual(Producto::query())
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
     * @return array{entradas: array, salidas: array, ajustes: array, por_dia: array, productos_mas_movidos: Collection}
     */
    public function resumenMovimientos(string $desde, string $hasta): array
    {
        $enRango = fn () => $this->paraEmpresaActual(Movimiento::query())->whereBetween('movimientos.created_at', ["{$desde} 00:00:00", "{$hasta} 23:59:59"]);

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

    /**
     * Agregado 2026-08-11 para el cierre del módulo Dashboard — mismo
     * eager-load que `MovimientoController::index()`, sin duplicar la
     * consulta base, solo acotado a los N más recientes de toda la
     * empresa (sin filtro de producto).
     */
    public function movimientosRecientes(int $limite = 6): Collection
    {
        return $this->paraEmpresaActual(Movimiento::query())
            ->with(['producto.unidadMedida', 'usuario'])
            ->latest('movimientos.created_at')
            ->limit($limite)
            ->get();
    }

    /**
     * Agregado 2026-08-11 para el cierre del módulo Dashboard — mismo
     * criterio de "stock bajo" que `productos_stock_bajo` en
     * `resumenInventario()`/`StockBajoReporte`, pero devolviendo el
     * listado completo en vez de solo el conteo.
     */
    public function productosConStockBajo(): Collection
    {
        return $this->paraEmpresaActual(Producto::query())
            ->where('estado', 'activo')
            ->whereColumn('stock_actual', '<=', 'stock_minimo')
            ->with('unidadMedida')
            ->orderBy('nombre')
            ->get();
    }

    public function resumenClientes(): array
    {
        return [
            'total_activos' => $this->paraEmpresaActual(Cliente::query())->where('estado', 'activo')->count(),
            'total_inactivos' => $this->paraEmpresaActual(Cliente::query())->where('estado', 'inactivo')->count(),
            'nuevos_ultimos_30_dias' => $this->paraEmpresaActual(Cliente::query())->where('created_at', '>=', now()->subDays(30))->count(),
        ];
    }

    public function resumenProveedores(): array
    {
        return [
            'total_activos' => $this->paraEmpresaActual(Proveedor::query())->where('estado', 'activo')->count(),
            'total_inactivos' => $this->paraEmpresaActual(Proveedor::query())->where('estado', 'inactivo')->count(),
            'top_proveedores' => $this->paraEmpresaActual(ProductoProveedor::query())
                ->where('producto_proveedor.estado', 'activo')
                ->join('proveedores', 'proveedores.id', '=', 'producto_proveedor.proveedor_id')
                ->selectRaw('proveedores.id as proveedor_id, proveedores.nombre as proveedor, COUNT(*) as total_productos')
                ->groupBy('proveedores.id', 'proveedores.nombre')
                ->orderByDesc('total_productos')
                ->limit(10)
                ->get(),
        ];
    }

    public function resumenCrm(): array
    {
        $oportunidadesAbiertas = $this->paraEmpresaActual(Oportunidad::query())
            ->whereNull('ganada_at')
            ->whereNull('perdida_at');

        return [
            'contactos' => $this->paraEmpresaActual(Contacto::query())->count(),
            'oportunidades_abiertas' => (clone $oportunidadesAbiertas)->count(),
            'valor_pipeline' => round((float) (clone $oportunidadesAbiertas)->sum('monto'), 2),
            'seguimientos_pendientes' => $this->paraEmpresaActual(Actividad::query())->where('estado', 'pendiente')->count(),
            'seguimientos_vencidos' => $this->paraEmpresaActual(Actividad::query())->where('estado', 'pendiente')->where('programada_para', '<', now())->count(),
            'automatizaciones_activas' => $this->paraEmpresaActual(Automatizacion::query())->where('activa', true)->count(),
        ];
    }

    /**
     * Registra una ejecución en el historial — llamado por
     * `ReporteService::generarReporte()` cada vez que se genera un
     * preview o se exporta un reporte. Nunca falla el flujo principal si
     * algo sale mal aquí: es un registro auxiliar, no la operación en sí.
     */
    public function registrarEjecucion(string $tipoReporte, string $formato, array $filtros, int $totalFilas, ?User $usuario): ReporteHistorial
    {
        return ReporteHistorial::create([
            'empresa_id' => $usuario?->empresa_id,
            'usuario_id' => $usuario?->id,
            'tipo_reporte' => $tipoReporte,
            'formato' => $formato,
            'filtros' => $filtros,
            'total_filas' => $totalFilas,
        ]);
    }

    /**
     * @param  array{tipo_reporte?: ?string, formato?: ?string, desde?: ?string, hasta?: ?string}  $filtros
     */
    public function historial(array $filtros, int $porPagina = 25): LengthAwarePaginator
    {
        return $this->paraEmpresaActual(ReporteHistorial::query())
            ->with('usuario:id,email')
            ->when($filtros['tipo_reporte'] ?? null, fn ($q, $v) => $q->where('tipo_reporte', $v))
            ->when($filtros['formato'] ?? null, fn ($q, $v) => $q->where('formato', $v))
            ->when($filtros['desde'] ?? null, fn ($q, $v) => $q->where('created_at', '>=', $v))
            ->when($filtros['hasta'] ?? null, fn ($q, $v) => $q->where('created_at', '<=', "{$v} 23:59:59"))
            ->latest('created_at')
            ->paginate($porPagina);
    }

    public function listarProgramados(): Collection
    {
        return $this->paraEmpresaActual(ReporteProgramado::query())->with('usuario:id,email')->latest()->get();
    }

    public function crearProgramado(array $datos, User $usuario): ReporteProgramado
    {
        return ReporteProgramado::create($datos + [
            'empresa_id' => $usuario->empresa_id,
            'usuario_id' => $usuario->id,
            'estado' => 'activo',
        ]);
    }

    public function eliminarProgramado(ReporteProgramado $programado): void
    {
        $programado->delete();
    }
}
