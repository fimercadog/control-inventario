<?php

namespace App\DTO\Report;

/**
 * Forma de resultado común a los 13 reportes (2026-08-03). Genérica a
 * propósito: `columnas`+`filas` es suficiente para renderizar CUALQUIER
 * reporte tabular en preview/PDF/Excel/CSV sin que el renderizador
 * necesite conocer el reporte específico — agregar un reporte nuevo
 * nunca implica tocar los renderizadores de exportación.
 */
final readonly class ReporteResultadoDTO
{
    /**
     * @param  array<int, array{clave: string, etiqueta: string}>  $columnas
     * @param  array<int, array<string, mixed>>  $filas
     * @param  array<string, mixed>  $resumen
     * @param  array<string, mixed>  $filtrosAplicados
     */
    public function __construct(
        public string $clave,
        public string $titulo,
        public array $columnas,
        public array $filas,
        public array $resumen = [],
        public array $filtrosAplicados = [],
        public int $total = 0,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'clave' => $this->clave,
            'titulo' => $this->titulo,
            'columnas' => $this->columnas,
            'filas' => $this->filas,
            'resumen' => $this->resumen,
            'filtros_aplicados' => $this->filtrosAplicados,
            'total' => $this->total,
        ];
    }
}
