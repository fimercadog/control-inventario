<?php

namespace App\Exceptions;

use Exception;

/**
 * Se intentó corregir o confirmar un detalle de captura que ya no está en
 * un estado editable (ya aplicado o descartado). Se traduce a HTTP 409
 * en la capa de Controllers (sección 42 del master spec).
 */
class CapturaIAEstadoInvalidoException extends Exception
{
}
