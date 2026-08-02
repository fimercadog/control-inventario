<?php

namespace App\Http\Controllers\Api;

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
        ]);

        return ApiResponse::success([
            'items' => AuditLogResource::collection($registros)->resolve(),
            'meta' => [
                'current_page' => $registros->currentPage(),
                'per_page' => $registros->perPage(),
                'total' => $registros->total(),
                'last_page' => $registros->lastPage(),
                'modulos_disponibles' => $this->auditoria->modulosDisponibles(),
                'acciones_disponibles' => $this->auditoria->accionesDisponibles(),
            ],
        ]);
    }

    public function show(AuditLog $auditLog): JsonResponse
    {
        $this->authorize('view', $auditLog);

        return ApiResponse::success(new AuditLogResource(
            $auditLog->load(['usuario:id,email', 'usuario.roles:id,name'])
        ));
    }
}
