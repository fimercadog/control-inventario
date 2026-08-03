<?php

namespace App\Policies;

use App\Models\ReporteHistorial;
use App\Models\ReporteProgramado;
use App\Models\User;

/**
 * Módulo Reportes — ampliación 2026-08-03. Una sola Policy para dos
 * modelos (`ReporteHistorial`, `ReporteProgramado`) — registrada
 * explícitamente en `AppServiceProvider::boot()` porque el
 * auto-discovery de Laravel espera una Policy por modelo (buscaría
 * `ReporteHistorialPolicy`/`ReporteProgramadoPolicy`); ambos conceptos
 * comparten exactamente las mismas reglas de autorización, así que
 * separarlos en dos clases sería duplicar código sin necesidad.
 *
 * `reportes.ver` sigue gateando la generación/lectura de reportes (sin
 * cambios respecto al dashboard, 2026-08-02). `reportes.gestionar` es
 * nuevo — gatea las únicas acciones de escritura reales de este módulo:
 * crear/editar/eliminar una definición de reporte programado.
 */
class ReportePolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('reportes.ver');
    }

    public function view(User $user, ReporteHistorial|ReporteProgramado $modelo): bool
    {
        return $this->ownedBy($user, $modelo) && $user->can('reportes.ver');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('reportes.gestionar');
    }

    public function update(User $user, ReporteProgramado $programado): bool
    {
        return $this->ownedBy($user, $programado) && $user->can('reportes.gestionar');
    }

    public function delete(User $user, ReporteProgramado $programado): bool
    {
        return $this->ownedBy($user, $programado) && $user->can('reportes.gestionar');
    }

    private function ownedBy(User $user, ReporteHistorial|ReporteProgramado $modelo): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $modelo->empresa_id;
    }
}
