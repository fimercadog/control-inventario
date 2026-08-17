<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Repositories\AuditLogRepository;

/**
 * "Audit Report" — reutiliza `AuditLogRepository::paginar()` (Módulo
 * Auditoría, 2026-08-02) directamente en vez de reconstruir la consulta
 * de `audit_logs`. Misma regla de privacidad: nunca el nombre real de la
 * persona, ya garantizado por el propio Repository (restringe las
 * columnas del eager-load, no solo las omite en el Resource).
 */
class ReporteAuditoria implements Reporte
{
    public function __construct(
        private readonly AuditLogRepository $auditoria,
    ) {}

    public function clave(): string
    {
        return 'auditoria';
    }

    public function nombre(): string
    {
        return 'Reporte de Auditoría';
    }

    public function descripcion(): string
    {
        return 'Eventos de auditoría registrados por los demás módulos, con los mismos filtros que la pantalla de Auditoría.';
    }

    public function filtrosDisponibles(): array
    {
        return [
            ['clave' => 'desde', 'etiqueta' => 'Desde', 'tipo' => 'fecha', 'requerido' => false],
            ['clave' => 'hasta', 'etiqueta' => 'Hasta', 'tipo' => 'fecha', 'requerido' => false],
            ['clave' => 'modulo', 'etiqueta' => 'Módulo', 'tipo' => 'select', 'requerido' => false],
            ['clave' => 'accion', 'etiqueta' => 'Acción', 'tipo' => 'select', 'requerido' => false],
        ];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $porPagina = $paginado ? max(1, (int) ($filtros['por_pagina'] ?? 50)) : 1_000_000;
        $pagina = $paginado ? max(1, (int) ($filtros['pagina'] ?? 1)) : 1;

        $resultado = $this->auditoria->paginar($filtros, $porPagina, $pagina);

        $filas = collect($resultado->items())->map(fn ($log) => [
            'fecha' => $log->created_at?->format('Y-m-d H:i'),
            'usuario' => $log->usuario?->email ?? 'Sistema',
            'roles' => $log->usuario ? $log->usuario->getRoleNames()->implode(', ') : '—',
            'modulo' => $log->modulo,
            'accion' => $log->accion,
            'resultado' => $log->resultado ?? '—',
        ])->all();

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: [
                ['clave' => 'fecha', 'etiqueta' => 'Fecha'],
                ['clave' => 'usuario', 'etiqueta' => 'Usuario'],
                ['clave' => 'roles', 'etiqueta' => 'Rol(es)'],
                ['clave' => 'modulo', 'etiqueta' => 'Módulo'],
                ['clave' => 'accion', 'etiqueta' => 'Acción'],
                ['clave' => 'resultado', 'etiqueta' => 'Resultado'],
            ],
            filas: $filas,
            filtrosAplicados: $filtros,
            total: $resultado->total(),
        );
    }
}
