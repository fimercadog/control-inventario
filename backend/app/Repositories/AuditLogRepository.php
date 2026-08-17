<?php

namespace App\Repositories;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Models\AuditLog;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Auditoría (2026-08-02). Solo lectura — `AuditLog` es inmutable por
 * diseño (`App\Models\AuditLog::update()`/`delete()` lanzan excepción) y
 * las escrituras siguen siendo exclusivas de `Services\Audit\AuditLogger`,
 * invocado por los demás módulos de negocio. Este Repository nunca
 * escribe. ADR-019: filtra `AuditLog::query()` explícitamente por empresa
 * (`FiltersByEmpresa`) — ya no vía `EmpresaScope` automático (eliminado).
 *
 * Restricción de columnas en el eager load de `usuario` — no un detalle
 * de rendimiento, es la regla de privacidad no negociable
 * (docs/03_FUNCTIONAL_SPEC/Auditoria.md): `users.name` nunca debe siquiera
 * hidratarse en memoria para un registro de auditoría, no solo omitirse
 * en el Resource.
 */
class AuditLogRepository
{
    use FiltersByEmpresa;

    /**
     * @param  array{busqueda?: ?string, modulo?: ?string, accion?: ?string, usuario_id?: ?int, resultado?: ?string, desde?: ?string, hasta?: ?string}  $filtros
     */
    /**
     * `$pagina` explícito agregado 2026-08-03 (módulo Reportes,
     * `ReporteAuditoria`) — opcional, no rompe la firma existente:
     * `AuditLogController` sigue sin pasarlo y usa el resolver implícito
     * de Laravel (`?page=` de la request), como siempre.
     */
    public function paginar(array $filtros, int $porPagina = 25, ?int $pagina = null): LengthAwarePaginator
    {
        $query = $this->paraEmpresaActual(AuditLog::query())->with(['usuario:id,email', 'usuario.roles:id,name']);

        if (! empty($filtros['busqueda'])) {
            $busqueda = $filtros['busqueda'];
            $query->where(function ($q) use ($busqueda) {
                $q->where('modulo', 'like', "%{$busqueda}%")
                    ->orWhere('accion', 'like', "%{$busqueda}%")
                    ->orWhere('resultado', 'like', "%{$busqueda}%")
                    ->orWhere('ip', 'like', "%{$busqueda}%");
            });
        }

        if (! empty($filtros['modulo'])) {
            $query->where('modulo', $filtros['modulo']);
        }

        if (! empty($filtros['accion'])) {
            $query->where('accion', $filtros['accion']);
        }

        if (! empty($filtros['usuario_id'])) {
            $query->where('usuario_id', $filtros['usuario_id']);
        }

        if (! empty($filtros['resultado'])) {
            $query->where('resultado', $filtros['resultado']);
        }

        if (! empty($filtros['desde'])) {
            $query->where('created_at', '>=', $filtros['desde']);
        }

        if (! empty($filtros['hasta'])) {
            $query->where('created_at', '<=', $filtros['hasta']);
        }

        return $query->latest('created_at')->paginate($porPagina, ['*'], 'page', $pagina);
    }

    /** @return Collection<int, string> */
    public function modulosDisponibles(): Collection
    {
        return $this->paraEmpresaActual(AuditLog::query())->distinct()->orderBy('modulo')->pluck('modulo');
    }

    /** @return Collection<int, string> */
    public function accionesDisponibles(): Collection
    {
        return $this->paraEmpresaActual(AuditLog::query())->distinct()->orderBy('accion')->pluck('accion');
    }
}
