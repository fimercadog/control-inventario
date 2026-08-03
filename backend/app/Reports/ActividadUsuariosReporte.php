<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Models\AuditLog;
use App\Models\User;
use App\Reports\Concerns\AplicaPaginacion;
use Carbon\Carbon;

/**
 * "User Activity" — agregado de acciones por usuario, derivado de
 * `audit_logs` (reutiliza la misma fuente que `ReporteAuditoria`, sin
 * duplicar el modelo). Misma regla de privacidad no negociable que el
 * módulo Auditoría: nunca el nombre real de la persona, solo email y
 * roles — este reporte es, en los hechos, una vista distinta sobre el
 * mismo dato sensible, así que hereda la misma restricción.
 */
class ActividadUsuariosReporte implements Reporte
{
    use AplicaPaginacion;

    public function clave(): string
    {
        return 'actividad-usuarios';
    }

    public function nombre(): string
    {
        return 'Actividad de Usuarios';
    }

    public function descripcion(): string
    {
        return 'Cantidad de acciones registradas por usuario dentro del rango seleccionado.';
    }

    public function filtrosDisponibles(): array
    {
        return [
            ['clave' => 'desde', 'etiqueta' => 'Desde', 'tipo' => 'fecha', 'requerido' => false],
            ['clave' => 'hasta', 'etiqueta' => 'Hasta', 'tipo' => 'fecha', 'requerido' => false],
        ];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $hasta = isset($filtros['hasta']) ? Carbon::parse($filtros['hasta']) : Carbon::today();
        $desde = isset($filtros['desde']) ? Carbon::parse($filtros['desde']) : $hasta->copy()->subDays(29);

        $conteos = AuditLog::query()
            ->whereBetween('created_at', [$desde->startOfDay(), $hasta->endOfDay()])
            ->whereNotNull('usuario_id')
            ->selectRaw('usuario_id, COUNT(*) as total_acciones')
            ->groupBy('usuario_id')
            ->orderByDesc('total_acciones')
            ->get();

        $total = $conteos->count();

        if ($paginado) {
            $porPagina = max(1, (int) ($filtros['por_pagina'] ?? 50));
            $pagina = max(1, (int) ($filtros['pagina'] ?? 1));
            $conteos = $conteos->slice(($pagina - 1) * $porPagina, $porPagina)->values();
        }

        // `User` no tiene TenantScope automático (decisión deliberada del
        // Módulo 4) — pero los `usuario_id` aquí ya vienen de AuditLog,
        // que sí está acotado por empresa, así que este lookup nunca
        // cruza empresas en la práctica.
        $usuarios = User::query()
            ->whereIn('id', $conteos->pluck('usuario_id'))
            ->get(['id', 'email', 'last_activity_at'])
            ->keyBy('id');

        $filas = $conteos->map(function ($fila) use ($usuarios) {
            $usuario = $usuarios->get($fila->usuario_id);

            return [
                'usuario' => $usuario?->email ?? 'Usuario eliminado',
                'roles' => $usuario ? $usuario->getRoleNames()->implode(', ') : '—',
                'total_acciones' => (int) $fila->total_acciones,
                'ultima_actividad' => $usuario?->last_activity_at?->format('Y-m-d H:i') ?? '—',
            ];
        })->all();

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: [
                ['clave' => 'usuario', 'etiqueta' => 'Usuario'],
                ['clave' => 'roles', 'etiqueta' => 'Rol(es)'],
                ['clave' => 'total_acciones', 'etiqueta' => 'Acciones registradas'],
                ['clave' => 'ultima_actividad', 'etiqueta' => 'Última actividad'],
            ],
            filas: $filas,
            filtrosAplicados: ['desde' => $desde->toDateString(), 'hasta' => $hasta->toDateString()],
            total: $total,
        );
    }
}
