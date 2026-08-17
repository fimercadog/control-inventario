<?php

namespace App\Exceptions;

use Exception;

/**
 * El movimiento dejaría stock_actual en negativo. Sección 23 del master
 * spec ("Inventario negativo") lo trata como alerta / regla de negocio.
 */
class StockInsuficienteException extends Exception
{
}
