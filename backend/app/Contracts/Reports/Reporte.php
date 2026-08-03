<?php

namespace App\Contracts\Reports;

use App\DTO\Report\ReporteResultadoDTO;

/**
 * Contrato de reporte (2026-08-03). Cada reporte del catálogo es una
 * clase independiente que implementa esta interfaz — `ReporteController`
 * nunca contiene lógica específica de un reporte; `ReporteService`
 * resuelve la clave a la clase correspondiente y delega. Agregar un
 * reporte nuevo es agregar una clase nueva a `App\Reports\`, registrarla
 * en `ReporteService::CATALOGO`, y nada más — ningún reporte existente
 * se modifica.
 */
interface Reporte
{
    /** Identificador estable, usado en la URL y en `reporte_historial.tipo_reporte`. */
    public function clave(): string;

    public function nombre(): string;

    public function descripcion(): string;

    /**
     * Filtros que este reporte acepta, para que el frontend construya el
     * formulario de filtros sin hardcodear supuestos por reporte.
     *
     * @return array<int, array{clave: string, etiqueta: string, tipo: string, requerido: bool}>
     */
    public function filtrosDisponibles(): array;

    /**
     * @param  array<string, mixed>  $filtros  incluye `pagina`/`por_pagina` cuando $paginado es true
     */
    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO;
}
