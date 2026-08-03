<?php

namespace App\Exports;

use App\DTO\Report\ReporteResultadoDTO;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Export genérico de Excel (2026-08-03) — funciona para CUALQUIER
 * reporte del catálogo porque solo conoce `columnas`/`filas` de
 * `ReporteResultadoDTO`, nunca un reporte específico. Agregar un reporte
 * nuevo nunca implica tocar esta clase.
 */
class ReporteExcelExport implements FromCollection, WithHeadings, WithTitle
{
    public function __construct(
        private readonly ReporteResultadoDTO $resultado,
    ) {}

    public function collection(): Collection
    {
        $claves = array_column($this->resultado->columnas, 'clave');

        return collect($this->resultado->filas)->map(
            fn (array $fila) => collect($claves)->map(fn (string $clave) => $fila[$clave] ?? '')->all()
        );
    }

    public function headings(): array
    {
        return array_column($this->resultado->columnas, 'etiqueta');
    }

    public function title(): string
    {
        // Excel limita el nombre de hoja a 31 caracteres.
        return mb_substr($this->resultado->titulo, 0, 31);
    }
}
