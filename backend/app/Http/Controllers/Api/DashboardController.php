<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Resources\Movimiento\MovimientoResource;
use App\Http\Resources\Producto\ProductoResource;
use App\Http\Support\ApiResponse;
use App\Repositories\ReporteRepository;
use App\Models\Actividad;
use App\Models\Oportunidad;
use App\Models\Contacto;
use Illuminate\Http\JsonResponse;

/**
 * Dashboard (2026-08-11, cierre definitivo del módulo — antes 100% mock
 * data en frontend). Sin permiso propio, a propósito: no existe
 * `dashboard.ver` en el catálogo y esta pantalla nunca tuvo gating por
 * permiso (docs/03_FUNCTIONAL_SPEC/Dashboard.md, "Permissions" —
 * cualquier usuario autenticado de una empresa la ve). Reutiliza
 * `ReporteRepository` (ya construido "para el dashboard" según su propio
 * docblock, nunca conectado hasta ahora) en vez de duplicar las
 * consultas agregadas — este Controller no contiene ninguna consulta
 * propia.
 */
class DashboardController extends Controller
{
    use FiltersByEmpresa;
    public function __construct(
        private readonly ReporteRepository $reportes,
    ) {}

    public function index(): JsonResponse
    {
        $hoy = now()->toDateString();
        $inventario = $this->reportes->resumenInventario();
        $movimientosHoy = $this->reportes->resumenMovimientos($hoy, $hoy);
        $actividades = $this->paraEmpresaActual(Actividad::query());
        $oportunidades = $this->paraEmpresaActual(Oportunidad::query());

        return ApiResponse::success([
            'total_productos' => $inventario['total_productos'],
            'total_stock' => $inventario['total_stock'],
            'productos_stock_bajo' => $inventario['productos_stock_bajo'],
            'entradas_hoy' => $movimientosHoy['entradas']['total'],
            'salidas_hoy' => $movimientosHoy['salidas']['total'],
            'movimientos_recientes' => MovimientoResource::collection($this->reportes->movimientosRecientes(6))->resolve(),
            'productos_con_stock_bajo' => ProductoResource::collection($this->reportes->productosConStockBajo())->resolve(),
            'crm' => [
                'contactos' => $this->paraEmpresaActual(Contacto::query())->count(),
                'oportunidades_abiertas' => (clone $oportunidades)->whereNull('ganada_at')->whereNull('perdida_at')->count(),
                'valor_pipeline' => (float) (clone $oportunidades)->whereNull('ganada_at')->whereNull('perdida_at')->sum('monto'),
                'actividades_pendientes' => (clone $actividades)->where('estado', 'pendiente')->count(),
                'actividades_vencidas' => (clone $actividades)->where('estado', 'pendiente')->where('programada_para', '<', now())->count(),
            ],
        ]);
    }
}
