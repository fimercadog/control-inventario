<?php

namespace App\Exceptions;

use Exception;

/**
 * Un usuario nunca puede desactivar su propia cuenta (docs/03_FUNCTIONAL_SPEC/Users.md,
 * Decisión confirmada 2). Se traduce a HTTP 409 (bootstrap/app.php).
 */
class CannotDeactivateSelfException extends Exception
{
}
