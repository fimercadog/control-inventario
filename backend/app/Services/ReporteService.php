<?php

namespace App\Services;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Models\ReporteProgramado;
use App\Models\User;
use App\Reports\ActividadUsuariosReporte;
use App\Reports\InventarioPorCategoriaReporte;
use App\Reports\InventarioPorMarcaReporte;
use App\Reports\InventarioPorProveedorReporte;
use App\Reports\InventarioResumenReporte;
use App\Reports\KardexProductoReporte;
use App\Reports\MovimientosInventarioReporte;
use App\Reports\ProductosSinMovimientoReporte;
use App\Reports\ReporteAuditoria;
use App\Reports\ReporteClientes;
use App\Reports\ReporteProveedores;
use App\Reports\StockActualReporte;
use App\Reports\StockBajoReporte;
use App\Repositories\ReporteRepository;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * Reportes (2026-08-02, ampliado 2026-08-03 a centro de reportes
 * completo). `generarResumen()` (dashboard) sigue siendo solo lectura
 * sobre agregados, sin cambios. Lo nuevo es el catálogo de 13 reportes:
 * este Service resuelve una `clave` a su clase (`CATALOGO`), delega la
 * generación a esa clase, y registra la ejecución en el historial —
 * nunca contiene lógica específica de un reporte en particular, eso vive
 * exclusivamente en cada clase de `App\Reports`.
 */
class ReporteService
{
    /** @var array<string, class-string<Reporte>> */
    private const CATALOGO = [
        'inventario-resumen' => InventarioResumenReporte::class,
        'stock-actual' => StockActualReporte::class,
        'stock-bajo' => StockBajoReporte::class,
        'inventario-por-categoria' => InventarioPorCategoriaReporte::class,
        'inventario-por-marca' => InventarioPorMarcaReporte::class,
        'inventario-por-proveedor' => InventarioPorProveedorReporte::class,
        'movimientos-inventario' => MovimientosInventarioReporte::class,
        'kardex-producto' => KardexProductoReporte::class,
        'productos-sin-movimiento' => ProductosSinMovimientoReporte::class,
        'proveedores' => ReporteProveedores::class,
        'clientes' => ReporteClientes::class,
        'actividad-usuarios' => ActividadUsuariosReporte::class,
        'auditoria' => ReporteAuditoria::class,
    ];

    public function __construct(
        private readonly ReporteRepository $reportes,
    ) {}

    /**
     * @return array{rango: array{desde: string, hasta: string}, inventario: array, movimientos: array, clientes: array, proveedores: array}
     */
    public function generarResumen(?string $desde, ?string $hasta): array
    {
        $hastaResuelta = $hasta ? Carbon::parse($hasta) : Carbon::today();
        $desdeResuelta = $desde ? Carbon::parse($desde) : $hastaResuelta->copy()->subDays(29);

        return [
            'rango' => [
                'desde' => $desdeResuelta->toDateString(),
                'hasta' => $hastaResuelta->toDateString(),
            ],
            'inventario' => $this->reportes->resumenInventario(),
            'movimientos' => $this->reportes->resumenMovimientos($desdeResuelta->toDateString(), $hastaResuelta->toDateString()),
            'clientes' => $this->reportes->resumenClientes(),
            'proveedores' => $this->reportes->resumenProveedores(),
        ];
    }

    /**
     * @return array<int, array{clave: string, nombre: string, descripcion: string, filtros_disponibles: array}>
     */
    public function catalogo(): array
    {
        return collect(self::CATALOGO)
            ->keys()
            ->map(fn (string $clave) => $this->resolverReporte($clave))
            ->map(fn (Reporte $reporte) => [
                'clave' => $reporte->clave(),
                'nombre' => $reporte->nombre(),
                'descripcion' => $reporte->descripcion(),
                'filtros_disponibles' => $reporte->filtrosDisponibles(),
            ])
            ->values()
            ->all();
    }

    public function resolverReporte(string $clave): Reporte
    {
        $clase = self::CATALOGO[$clave] ?? null;

        if ($clase === null) {
            throw ValidationException::withMessages(['reporte' => "El reporte '{$clave}' no existe en el catálogo."]);
        }

        return app($clase);
    }

    public function generarReporte(string $clave, array $filtros, bool $paginado, ?User $usuario, string $formato = 'json'): ReporteResultadoDTO
    {
        $resultado = $this->resolverReporte($clave)->generar($filtros, $paginado);

        $this->reportes->registrarEjecucion($clave, $formato, $filtros, $resultado->total, $usuario);

        return $resultado;
    }

    public function historial(array $filtros, int $porPagina = 25): LengthAwarePaginator
    {
        return $this->reportes->historial($filtros, $porPagina);
    }

    public function listarProgramados(): Collection
    {
        return $this->reportes->listarProgramados();
    }

    public function crearProgramado(array $datos, User $usuario): ReporteProgramado
    {
        if (! array_key_exists($datos['tipo_reporte'] ?? '', self::CATALOGO)) {
            throw ValidationException::withMessages(['tipo_reporte' => 'El tipo de reporte seleccionado no existe en el catálogo.']);
        }

        return $this->reportes->crearProgramado($datos, $usuario);
    }

    public function eliminarProgramado(ReporteProgramado $programado): void
    {
        $this->reportes->eliminarProgramado($programado);
    }
}
