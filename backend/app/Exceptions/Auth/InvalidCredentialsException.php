<?php

namespace App\Exceptions\Auth;

use Exception;

/**
 * Credenciales inválidas. Deliberadamente el mismo mensaje/código sin
 * importar si el email no existe o la contraseña es incorrecta — nunca
 * se revela cuál de los dos fue, para no habilitar enumeración de usuarios.
 */
class InvalidCredentialsException extends Exception
{
}
