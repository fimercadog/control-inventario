<?php

namespace App\Enums\CapturaIA;

enum EstadoCaptura: string
{
    // Transitorio: la captura fue recibida y encolada pero el pipeline de
    // IA todavía no corrió (sección 74 del master spec, punto 8,
    // "Preparar la arquitectura para procesamiento asíncrono"). El pipeline
    // síncrono actual nunca deja una captura en este estado.
    case Procesando = 'procesando';
    case PendienteRevision = 'pendiente_revision';
    case Aplicado = 'aplicado';
    case Parcial = 'parcial';
    case Descartado = 'descartado';

    /**
     * Agrega el estado general de una captura a partir del estado de sus
     * detalles. Única regla, reutilizada tanto al procesar una captura
     * (CapturaIARepository) como al confirmarla (CapturaIAService), para
     * no duplicarla en dos sitios.
     *
     * @param iterable<EstadoCapturaDetalle> $estadosDetalle
     */
    public static function agregarDesde(iterable $estadosDetalle): self
    {
        $estados = is_array($estadosDetalle) ? $estadosDetalle : iterator_to_array($estadosDetalle);

        if ($estados === []) {
            return self::Descartado;
        }

        $todosAplicados = true;
        $todosPendientes = true;
        $todosDescartados = true;

        foreach ($estados as $estado) {
            $todosAplicados = $todosAplicados && $estado === EstadoCapturaDetalle::Aplicado;
            $todosPendientes = $todosPendientes && in_array($estado, [EstadoCapturaDetalle::PendienteRevision, EstadoCapturaDetalle::Corregido], true);
            $todosDescartados = $todosDescartados && $estado === EstadoCapturaDetalle::Descartado;
        }

        return match (true) {
            $todosAplicados => self::Aplicado,
            $todosDescartados => self::Descartado,
            $todosPendientes => self::PendienteRevision,
            default => self::Parcial,
        };
    }
}
