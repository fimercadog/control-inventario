<?php

namespace App\Services;

use App\Repositories\ReporteRepository;
use Carbon\Carbon;

/**
 * Reportes (2026-08-02). Solo lectura por diseño — no hay crear/
 * actualizar/eliminar, "Reportes" no es un recurso persistido, es una
 * vista computada sobre Productos/Movimientos/Clientes/Proveedores.
 */
class ReporteService
{
    public function __construct(
        private readonly ReporteRepository $reportes,
    ) {
    }

    /**
     * @return array{rango: array{desde: string, hasta: string}, inventario: array, movimientos: array, clientes: array, proveedores: array}
     */
    public function generarResumen(?string $desde, ?string $hasta): array
    {
        $hastaResuelta = $hasta ? Carbon::parse($hasta) : Carbon::today();
        $desdeResuelta = $desde ? Carbon::parse($desde) : $hastaResuelta->copy()->subDays(29);

        return [
            'rango' => [
                'desde' => $desdeResuelta->toDateString(),
                'hasta' => $hastaResuelta->toDateString(),
            ],
            'inventario' => $this->reportes->resumenInventario(),
            'movimientos' => $this->reportes->resumenMovimientos($desdeResuelta->toDateString(), $hastaResuelta->toDateString()),
            'clientes' => $this->reportes->resumenClientes(),
            'proveedores' => $this->reportes->resumenProveedores(),
        ];
    }
}
