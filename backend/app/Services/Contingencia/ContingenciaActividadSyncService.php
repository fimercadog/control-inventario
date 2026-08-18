<?php

namespace App\Services\Contingencia;

use App\Models\Actividad;
use App\Models\ContingenciaActividadSyncLog;
use Illuminate\Support\Facades\DB;

class ContingenciaActividadSyncService
{
    /** @param array<string, mixed> $payload */
    public function procesar(int $empresaId, int $usuarioId, string $operacionId, array $payload): Actividad
    {
        $previa = ContingenciaActividadSyncLog::query()->where('empresa_id', $empresaId)->where('operacion_id', $operacionId)->first();
        if ($previa?->actividad_id) return Actividad::findOrFail($previa->actividad_id);

        return DB::transaction(function () use ($empresaId, $usuarioId, $operacionId, $payload) {
            $actividad = Actividad::create([
                'empresa_id' => $empresaId,
                'responsable_id' => $usuarioId,
                'creado_por_id' => $usuarioId,
                'tipo' => $payload['tipo'],
                'asunto' => $payload['asunto'],
                'descripcion' => $payload['descripcion'] ?? null,
                'estado' => 'pendiente',
                'programada_para' => $payload['programada_para'] ?? now(),
            ]);
            ContingenciaActividadSyncLog::create(['empresa_id' => $empresaId, 'usuario_id' => $usuarioId, 'operacion_id' => $operacionId, 'actividad_id' => $actividad->id, 'procesado_at' => now()]);
            return $actividad;
        });
    }
}
