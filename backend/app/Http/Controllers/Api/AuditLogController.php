<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Concerns\ResolvesPagination;
use App\Http\Controllers\Controller;
use App\Http\Resources\Audit\AuditLogResource;
use App\Http\Support\ApiResponse;
use App\Models\AuditLog;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Auditoría (2026-08-02). Solo lectura por diseño — `index`/`show`
 * únicamente, sin `store`/`update`/`destroy`. Ver `AuditLogPolicy` y
 * `AuditLogService`.
 */
class AuditLogController extends Controller
{
    use FiltersByEmpresa;
    use ResolvesPagination;

    public function __construct(
        private readonly AuditLogService $auditoria,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        $registros = $this->auditoria->listar([
            'busqueda' => $request->query('busqueda'),
            'modulo' => $request->query('modulo'),
            'accion' => $request->query('accion'),
            'usuario_id' => $request->query('usuario_id'),
            'resultado' => $request->query('resultado'),
            'desde' => $request->query('desde'),
            'hasta' => $request->query('hasta'),
        ], $this->perPageDeRequest($request, 25));

        return ApiResponse::success([
            'items' => AuditLogResource::collection($registros)->resolve(),
            'meta' => [
                ...$this->metaDePaginacion($registros),
                'modulos_disponibles' => $this->auditoria->modulosDisponibles(),
                'acciones_disponibles' => $this->auditoria->accionesDisponibles(),
            ],
        ]);
    }

    public function show(int $auditLog): JsonResponse
    {
        $auditLog = $this->resolverParaEmpresaActual(AuditLog::class, $auditLog);
        $this->authorize('view', $auditLog);

        return ApiResponse::success(new AuditLogResource(
            $auditLog->load(['usuario:id,email', 'usuario.roles:id,name'])
        ));
    }
}
