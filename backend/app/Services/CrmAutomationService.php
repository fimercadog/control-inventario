<?php

namespace App\Services;

use App\Models\Actividad;
use App\Models\Automatizacion;
use App\Models\NotificacionCrm;
use App\Models\Oportunidad;
use Illuminate\Database\QueryException;

class CrmAutomationService
{
    /** Executes enabled rules once per event/resource pair. */
    public function dispatch(string $event, Oportunidad $oportunidad): void
    {
        $rules = Automatizacion::query()->where('empresa_id', $oportunidad->empresa_id)->where('evento', $event)->where('activa', true)->get();
        foreach ($rules as $rule) {
            $key = hash('sha256', "$event:{$oportunidad->id}:{$oportunidad->updated_at?->getTimestamp()}");
            try {
                $run = $rule->ejecuciones()->create([
                    'empresa_id' => $oportunidad->empresa_id, 'evento' => $event, 'entidad_tipo' => Oportunidad::class,
                    'entidad_id' => $oportunidad->id, 'clave_idempotencia' => $key, 'estado' => 'completada', 'resultado' => [],
                ]);
            } catch (QueryException) {
                continue;
            }
            foreach ($rule->acciones as $action) {
                if (($action['tipo'] ?? null) === 'crear_actividad') {
                    Actividad::create(['empresa_id' => $oportunidad->empresa_id, 'oportunidad_id' => $oportunidad->id, 'cliente_id' => $oportunidad->cliente_id, 'responsable_id' => $action['responsable_id'] ?? $oportunidad->responsable_id, 'tipo' => 'tarea', 'asunto' => $action['asunto'] ?? "Seguimiento: {$oportunidad->nombre}", 'estado' => 'pendiente', 'programada_para' => now()->addDays((int) ($action['dias'] ?? 1))]);
                }
                if (($action['tipo'] ?? null) === 'notificar' && $oportunidad->responsable_id) {
                    NotificacionCrm::create(['empresa_id' => $oportunidad->empresa_id, 'usuario_id' => $oportunidad->responsable_id, 'tipo' => 'automatizacion', 'titulo' => $action['titulo'] ?? 'Seguimiento comercial', 'mensaje' => $action['mensaje'] ?? "Hay una actualización en {$oportunidad->nombre}", 'datos' => ['oportunidad_id' => $oportunidad->id]]);
                }
            }
            $run->update(['resultado' => ['acciones' => count($rule->acciones)]]);
        }
    }
}
