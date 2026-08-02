<?php

namespace App\Exceptions;

use Exception;

/**
 * Un usuario nunca puede desactivarse si es el último usuario activo de su
 * empresa con el permiso `usuarios.editar` — dejaría a la empresa sin nadie
 * capaz de gestionar cuentas (docs/03_FUNCTIONAL_SPEC/Users.md, Decisión
 * confirmada 3). Se traduce a HTTP 409 (bootstrap/app.php).
 */
class LastCompanyAdminException extends Exception
{
}
