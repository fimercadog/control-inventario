<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Resources\Movimiento\MovimientoResource;
use App\Http\Resources\Producto\ProductoResource;
use App\Http\Support\ApiResponse;
use App\Repositories\ReporteRepository;
use App\Models\Actividad;
use App\Models\Automatizacion;
use App\Models\EjecucionAutomatizacion;
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
        $oportunidadesAbiertas = (clone $oportunidades)->whereNull('ganada_at')->whereNull('perdida_at');
        $actividadesVencidas = (clone $actividades)
            ->where('estado', 'pendiente')
            ->where('programada_para', '<', now());
        $contactos = $this->paraEmpresaActual(Contacto::query());
        $automatizaciones = $this->paraEmpresaActual(Automatizacion::query());
        $sinGestionDesde = now()->subDays(14);
        $emailsDuplicados = (clone $contactos)
            ->select('email')
            ->whereNotNull('email')
            ->groupBy('email')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('email');

        return ApiResponse::success([
            'total_productos' => $inventario['total_productos'],
            'total_stock' => $inventario['total_stock'],
            'productos_stock_bajo' => $inventario['productos_stock_bajo'],
            'entradas_hoy' => $movimientosHoy['entradas']['total'],
            'salidas_hoy' => $movimientosHoy['salidas']['total'],
            'movimientos_recientes' => MovimientoResource::collection($this->reportes->movimientosRecientes(6))->resolve(),
            'productos_con_stock_bajo' => ProductoResource::collection($this->reportes->productosConStockBajo())->resolve(),
            'crm' => [
                'contactos' => (clone $contactos)->count(),
                'prospectos' => (clone $contactos)->where('estado', 'prospecto')->count(),
                'oportunidades_abiertas' => (clone $oportunidadesAbiertas)->count(),
                'valor_pipeline' => (float) (clone $oportunidadesAbiertas)->sum('monto'),
                'actividades_pendientes' => (clone $actividades)->where('estado', 'pendiente')->count(),
                'actividades_vencidas' => (clone $actividadesVencidas)->count(),
                'actividades_vencidas_destacadas' => (clone $actividadesVencidas)
                    ->with(['oportunidad:id,nombre,cliente_id', 'oportunidad.cliente:id,nombre', 'cliente:id,nombre'])
                    ->orderBy('programada_para')
                    ->limit(4)
                    ->get()
                    ->map(fn (Actividad $actividad) => [
                        'id' => $actividad->id,
                        'asunto' => $actividad->asunto,
                        'programada_para' => $actividad->programada_para?->toIso8601String(),
                        'cliente' => $actividad->cliente?->nombre ?? $actividad->oportunidad?->cliente?->nombre,
                        'oportunidad' => $actividad->oportunidad?->nombre,
                    ])->values(),
                'oportunidades_destacadas' => (clone $oportunidadesAbiertas)
                    ->with(['cliente:id,nombre', 'etapa:id,nombre,tipo', 'responsable:id,name'])
                    ->orderByDesc('monto')
                    ->limit(5)
                    ->get()
                    ->map(fn (Oportunidad $oportunidad) => [
                        'id' => $oportunidad->id,
                        'nombre' => $oportunidad->nombre,
                        'monto' => (float) $oportunidad->monto,
                        'fecha_cierre_estimada' => $oportunidad->fecha_cierre_estimada?->toDateString(),
                        'cliente' => $oportunidad->cliente?->nombre,
                        'etapa' => $oportunidad->etapa?->nombre,
                        'responsable' => $oportunidad->responsable?->name,
                    ])->values(),
                'proximas_actividades' => (clone $actividades)
                    ->where('estado', 'pendiente')
                    ->whereNotNull('programada_para')
                    ->with(['oportunidad:id,nombre,cliente_id', 'oportunidad.cliente:id,nombre', 'cliente:id,nombre', 'responsable:id,name'])
                    ->orderBy('programada_para')
                    ->limit(5)
                    ->get()
                    ->map(fn (Actividad $actividad) => [
                        'id' => $actividad->id,
                        'asunto' => $actividad->asunto,
                        'tipo' => $actividad->tipo,
                        'programada_para' => $actividad->programada_para?->toIso8601String(),
                        'cliente' => $actividad->cliente?->nombre ?? $actividad->oportunidad?->cliente?->nombre,
                        'oportunidad' => $actividad->oportunidad?->nombre,
                        'responsable' => $actividad->responsable?->name,
                    ])->values(),
                'alertas' => [
                    'contactos_sin_responsable' => (clone $contactos)->whereNull('responsable_id')->count(),
                    'contactos_sin_gestion' => (clone $contactos)
                        ->where('created_at', '<=', $sinGestionDesde)
                        ->whereDoesntHave('actividades', fn ($query) => $query->where('created_at', '>=', $sinGestionDesde))
                        ->count(),
                    'contactos_duplicados' => (clone $contactos)->whereIn('email', $emailsDuplicados)->count(),
                    'oportunidades_cierre_vencido' => (clone $oportunidadesAbiertas)
                        ->whereDate('fecha_cierre_estimada', '<', today())
                        ->count(),
                    'oportunidades_estancadas' => (clone $oportunidadesAbiertas)
                        ->where('created_at', '<=', $sinGestionDesde)
                        ->whereDoesntHave('actividades', fn ($query) => $query->where('created_at', '>=', $sinGestionDesde))
                        ->count(),
                    'oportunidades_sin_responsable' => (clone $oportunidadesAbiertas)->whereNull('responsable_id')->count(),
                    'actividades_para_hoy' => (clone $actividades)->where('estado', 'pendiente')->whereDate('programada_para', today())->count(),
                    'actividades_sin_responsable' => (clone $actividades)->where('estado', 'pendiente')->whereNull('responsable_id')->count(),
                    'actividades_sin_fecha' => (clone $actividades)->where('estado', 'pendiente')->whereNull('programada_para')->count(),
                    'automatizaciones_con_error' => $this->paraEmpresaActual(EjecucionAutomatizacion::query())->where('estado', 'error')->count(),
                    'automatizaciones_sin_ejecucion' => (clone $automatizaciones)
                        ->where('activa', true)
                        ->where('created_at', '<=', $sinGestionDesde)
                        ->whereDoesntHave('ejecuciones')
                        ->count(),
                    'automatizaciones_desactivadas' => (clone $automatizaciones)->where('activa', false)->count(),
                ],
            ],
        ]);
    }
}
