<?php

namespace App\Services;

use App\Repositories\AuditLogRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Auditoría (2026-08-02). Solo lectura por diseño — ver
 * `AuditLogRepository`. No hay crear/actualizar/eliminar en este Service:
 * las escrituras siguen siendo responsabilidad exclusiva de
 * `Services\Audit\AuditLogger`, ya usado por otros 10 módulos.
 */
class AuditLogService
{
    public function __construct(
        private readonly AuditLogRepository $auditoria,
    ) {
    }

    /**
     * @param array<string, mixed> $filtros
     */
    public function listar(array $filtros, int $porPagina = 25): LengthAwarePaginator
    {
        return $this->auditoria->paginar($filtros, $porPagina);
    }

    /** @return Collection<int, string> */
    public function modulosDisponibles(): Collection
    {
        return $this->auditoria->modulosDisponibles();
    }

    /** @return Collection<int, string> */
    public function accionesDisponibles(): Collection
    {
        return $this->auditoria->accionesDisponibles();
    }
}
