<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contingencia\SincronizarActividadRequest;
use App\Http\Support\ApiResponse;
use App\Services\Audit\AuditLogger;
use App\Services\Contingencia\ContingenciaActividadSyncService;
use Illuminate\Http\JsonResponse;

class ContingenciaActividadController extends Controller
{
    public function __construct(private readonly ContingenciaActividadSyncService $sync, private readonly AuditLogger $auditoria) {}

    public function sincronizar(SincronizarActividadRequest $request): JsonResponse
    {
        $datos = $request->validated();
        $actividad = $this->sync->procesar($request->user()->empresa_id, $request->user()->id, $datos['operacion_id'], $datos['payload']);
        $this->auditoria->registrarAccionManual(empresaId: $actividad->empresa_id, usuarioId: $request->user()->id, modulo: 'contingencia', accion: 'contingencia.actividad_manual', auditableType: Actividad::class, auditableId: $actividad->id, valoresNuevos: ['operacion_id' => $datos['operacion_id'], 'asunto' => $actividad->asunto], ip: $request->ip(), userAgent: $request->userAgent());
        return ApiResponse::success($actividad, 'Actividad manual sincronizada correctamente');
    }
}
