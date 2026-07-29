<?php

namespace App\Exceptions\Auth;

use Exception;

/**
 * El refresh token enviado no existe, ya fue revocado (rotado o logout),
 * o expiró. Nunca se distingue cuál de los tres casos es al cliente —
 * solo "tu sesión expiró, inicia sesión de nuevo" (bootstrap/app.php).
 */
class InvalidRefreshTokenException extends Exception
{
}
