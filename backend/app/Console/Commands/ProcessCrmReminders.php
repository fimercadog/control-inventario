<?php

namespace App\Console\Commands;

use App\Models\Actividad;
use App\Models\NotificacionCrm;
use App\Models\Oportunidad;
use Illuminate\Console\Command;

class ProcessCrmReminders extends Command
{
    protected $signature = 'crm:procesar-recordatorios {--dry-run : No persiste cambios}';
    protected $description = 'Marca actividades vencidas y crea recordatorios de oportunidades sin seguimiento.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $vencidas = Actividad::query()->where('estado', 'pendiente')->whereNotNull('programada_para')->where('programada_para', '<', now())->get();
        foreach ($vencidas as $actividad) {
            if (!$dryRun) {
                $actividad->update(['estado' => 'vencida']);
                if ($actividad->responsable_id) {
                    NotificacionCrm::firstOrCreate(['empresa_id' => $actividad->empresa_id, 'usuario_id' => $actividad->responsable_id, 'tipo' => 'actividad_vencida', 'datos' => ['actividad_id' => $actividad->id]], ['titulo' => 'Seguimiento vencido', 'mensaje' => $actividad->asunto]);
                }
            }
        }
        $limite = now()->subDays(7);
        $sinSeguimiento = Oportunidad::query()->whereNull('ganada_at')->whereNull('perdida_at')->whereDoesntHave('actividades', fn ($query) => $query->where('created_at', '>=', $limite))->get();
        foreach ($sinSeguimiento as $oportunidad) {
            if (!$dryRun) {
                Actividad::firstOrCreate(['empresa_id' => $oportunidad->empresa_id, 'oportunidad_id' => $oportunidad->id, 'asunto' => 'Retomar seguimiento comercial'], ['cliente_id' => $oportunidad->cliente_id, 'responsable_id' => $oportunidad->responsable_id, 'tipo' => 'tarea', 'estado' => 'pendiente', 'programada_para' => now()->addDay()]);
            }
        }
        $this->info("{$vencidas->count()} actividades vencidas; {$sinSeguimiento->count()} oportunidades revisadas.");
        return self::SUCCESS;
    }
}
