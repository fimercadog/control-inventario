<?php

namespace App\Services\Reports;

use App\DTO\Report\ReporteResultadoDTO;
use App\Exports\ReporteExcelExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Renderizadores de exportación (2026-08-03) — los tres trabajan
 * exclusivamente sobre `columnas`/`filas` de `ReporteResultadoDTO`, nunca
 * sobre un reporte específico. Agregar un reporte nuevo al catálogo
 * nunca implica tocar esta clase; agregar un formato de exportación
 * nuevo sí, pero una sola vez, no 13.
 */
class ReporteExportService
{
    public function pdf(ReporteResultadoDTO $resultado): Response
    {
        return Pdf::loadView('reports.pdf', ['resultado' => $resultado])
            ->setPaper('a4', 'landscape')
            ->download($this->nombreArchivo($resultado, 'pdf'));
    }

    public function excel(ReporteResultadoDTO $resultado): BinaryFileResponse
    {
        return Excel::download(new ReporteExcelExport($resultado), $this->nombreArchivo($resultado, 'xlsx'));
    }

    public function csv(ReporteResultadoDTO $resultado): StreamedResponse
    {
        $nombreArchivo = $this->nombreArchivo($resultado, 'csv');

        $response = new StreamedResponse(function () use ($resultado) {
            $handle = fopen('php://output', 'w');
            // BOM UTF-8 — Excel en Windows interpreta mal acentos sin esto.
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, array_column($resultado->columnas, 'etiqueta'));

            $claves = array_column($resultado->columnas, 'clave');
            foreach ($resultado->filas as $fila) {
                fputcsv($handle, array_map(fn (string $clave) => $fila[$clave] ?? '', $claves));
            }

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', "attachment; filename=\"{$nombreArchivo}\"");

        return $response;
    }

    private function nombreArchivo(ReporteResultadoDTO $resultado, string $extension): string
    {
        return "{$resultado->clave}-".now()->format('Y-m-d').".{$extension}";
    }
}
