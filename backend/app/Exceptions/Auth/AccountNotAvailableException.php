<?php

namespace App\Exceptions\Auth;

use Exception;

/**
 * Credenciales correctas pero la cuenta no puede iniciar sesión todavía:
 * desactivada (`is_active = false`) o con el correo sin verificar. A
 * diferencia de InvalidCredentialsException, aquí sí es seguro decir la
 * razón — el usuario ya demostró que conoce la contraseña correcta.
 */
class AccountNotAvailableException extends Exception
{
}
