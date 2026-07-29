<?php

namespace App\Exceptions;

use Exception;

/**
 * El proveedor de IA no devolvió una respuesta válida según el contrato
 * { "products": [...], "movement": "..." } (ver sección 74 del master spec).
 * Se traduce a HTTP 502 en la capa de Controllers.
 */
class AIProviderException extends Exception
{
}
