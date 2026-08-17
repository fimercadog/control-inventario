<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Requests\Reporte\StoreReporteProgramadoRequest;
use App\Http\Support\ApiResponse;
use App\Models\ReporteProgramado;
use App\Services\ReporteService;
use App\Services\Reports\ReporteExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Reportes (2026-08-02, ampliado 2026-08-03 a centro de reportes
 * completo). Este Controller nunca contiene lógica específica de un
 * reporte — `catalogo()`/`preview()`/`exportarX()` delegan íntegramente
 * a `ReporteService::resolverReporte()`/`generarReporte()`, que a su vez
 * delega a la clase de `App\Reports\` correspondiente a la clave. Sin
 * `ReportePolicy` para las acciones de lectura de reportes (mismo motivo
 * que el `index()` original: "Reportes" no es un recurso Eloquent);
 * `ReportePolicy` sí aplica para `programados*`, que sí operan sobre un
 * modelo real (`ReporteProgramado`).
 */
class ReporteController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly ReporteService $reportes,
        private readonly ReporteExportService $exportador,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('reportes.ver');

        return ApiResponse::success(
            $this->reportes->generarResumen($request->query('desde'), $request->query('hasta'))
        );
    }

    public function catalogo(): JsonResponse
    {
        $this->authorize('reportes.ver');

        return ApiResponse::success($this->reportes->catalogo());
    }

    public function preview(Request $request, string $clave): JsonResponse
    {
        $this->authorize('reportes.ver');

        $resultado = $this->reportes->generarReporte(
            $clave,
            $request->query(),
            paginado: true,
            usuario: $request->user(),
            formato: 'preview',
        );

        // `AplicaPaginacion` (usada por los 13 reportes) ya recortó `filas`
        // a la página pedida — acá solo se calcula el `meta` a partir de
        // `total`, sin tocar los 13 reportes ni el DTO compartido
        // (`ReporteResultadoDTO` no carga campos de paginación).
        $porPagina = $this->perPageDeRequest($request, 50);
        $total = $resultado->total;
        $lastPage = max(1, (int) ceil($total / $porPagina));
        $pagina = min($lastPage, max(1, (int) $request->query('page', 1)));

        return ApiResponse::success([
            ...$resultado->toArray(),
            'meta' => [
                'current_page' => $pagina,
                'per_page' => $porPagina,
                'total' => $total,
                'last_page' => $lastPage,
                'from' => $total > 0 ? ($pagina - 1) * $porPagina + 1 : null,
                'to' => $total > 0 ? min($total, $pagina * $porPagina) : null,
            ],
        ]);
    }

    public function exportarPdf(Request $request, string $clave): Response
    {
        $this->authorize('reportes.ver');

        $resultado = $this->reportes->generarReporte($clave, $request->query(), paginado: false, usuario: $request->user(), formato: 'pdf');

        return $this->exportador->pdf($resultado);
    }

    public function exportarExcel(Request $request, string $clave): BinaryFileResponse
    {
        $this->authorize('reportes.ver');

        $resultado = $this->reportes->generarReporte($clave, $request->query(), paginado: false, usuario: $request->user(), formato: 'excel');

        return $this->exportador->excel($resultado);
    }

    public function exportarCsv(Request $request, string $clave): StreamedResponse
    {
        $this->authorize('reportes.ver');

        $resultado = $this->reportes->generarReporte($clave, $request->query(), paginado: false, usuario: $request->user(), formato: 'csv');

        return $this->exportador->csv($resultado);
    }

    public function historial(Request $request): JsonResponse
    {
        $this->authorize('reportes.ver');

        $registros = $this->reportes->historial($request->query(), $this->perPageDeRequest($request, 25));

        return ApiResponse::success([
            'items' => $registros->items(),
            'meta' => $this->metaDePaginacion($registros),
        ]);
    }

    public function programadosIndex(): JsonResponse
    {
        $this->authorize('viewAny', ReporteProgramado::class);

        return ApiResponse::success($this->reportes->listarProgramados());
    }

    public function programadosStore(StoreReporteProgramadoRequest $request): JsonResponse
    {
        $this->authorize('create', ReporteProgramado::class);

        $programado = $this->reportes->crearProgramado($request->validated(), $request->user());

        return ApiResponse::success($programado, 'Reporte programado creado correctamente', 201);
    }

    public function programadosDestroy(int $programado): JsonResponse
    {
        $programado = $this->resolverParaEmpresaActual(ReporteProgramado::class, $programado);
        $this->authorize('delete', $programado);

        $this->reportes->eliminarProgramado($programado);

        return ApiResponse::success(null, 'Reporte programado eliminado correctamente');
    }
}
