<?php

namespace App\Exceptions;

use Exception;

/**
 * Dos requests con la misma Idempotency-Key llegaron a la vez y ambas
 * intentaron insertar la captura (índice único empresa_id+idempotency_key
 * en capturas_ia). Quien la lanza ya hizo rollback de todo lo que había
 * escrito en su intento; el llamador debe recuperar la captura que sí
 * ganó la carrera (sección 74 del master spec, punto 4).
 */
class IdempotencyConflictException extends Exception
{
    public function __construct(
        public readonly int $empresaId,
        public readonly string $idempotencyKey,
    ) {
        parent::__construct("Ya existe una captura con idempotency_key '{$idempotencyKey}' para la empresa #{$empresaId}.");
    }
}
