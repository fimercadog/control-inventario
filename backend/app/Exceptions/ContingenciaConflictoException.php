<?php

namespace App\Exceptions;

use App\Models\Producto;
use Exception;

/**
 * Modo Contingencia — sección 11 del Work Order ("Actualizaciones
 * offline"), CRÍTICO: una operación de actualizar creada offline nunca
 * sobrescribe silenciosamente un cambio que ocurrió en el servidor
 * mientras el cliente estaba desconectado. Se detecta comparando
 * `producto.updated_at` (mecanismo de concurrencia ya disponible en
 * Eloquent — no se agrega una columna de versión nueva) contra el
 * `base_version` que el cliente capturó al crear la operación local.
 *
 * Distinta de `IdempotencyConflictException` (dos requests con la misma
 * clave compitiendo) — este es un conflicto de datos real, no de
 * concurrencia de red.
 */
class ContingenciaConflictoException extends Exception
{
    public function __construct(
        public readonly Producto $productoServidor,
        public readonly string $baseVersionCliente,
    ) {
        parent::__construct('El producto cambió en el servidor después de que esta operación se creó sin conexión.');
    }
}
