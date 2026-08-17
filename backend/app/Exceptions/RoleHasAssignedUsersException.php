<?php

namespace App\Exceptions;

use Exception;

/**
 * Un rol nunca puede desactivarse mientras tenga usuarios asignados —
 * activos o inactivos, cualquiera con `model_has_roles` apuntando a este
 * rol (docs/security/ROLES_MATRIX.md, sección 6, confirmado explícitamente
 * por el propietario del proyecto). Deben reasignarse a otro rol primero.
 * Se traduce a HTTP 409 (bootstrap/app.php).
 */
class RoleHasAssignedUsersException extends Exception
{
}
