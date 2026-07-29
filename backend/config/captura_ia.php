<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Umbral de confianza — Módulo Captura IA
    |--------------------------------------------------------------------------
    |
    | docs/00_MASTER_SPECIFICATION.md sección 74, "Umbral de confianza".
    | >= umbral: se aplica automáticamente a productos/movimientos.
    | <  umbral: queda en cola de revisión, no se toca stock.
    |
    | Por ahora es un valor global vía .env; queda preparado para volverse
    | por-empresa cuando exista la tabla `configuraciones` (sección 73).
    |
    */
    'confidence_threshold' => (float) env('CAPTURA_IA_CONFIDENCE_THRESHOLD', 0.85),

];
