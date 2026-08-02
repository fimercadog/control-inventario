<?php

namespace App\Policies;

use App\Models\User;

/**
 * RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md). `User` no tiene
 * `TenantScope` automático como Producto/Categoria/Movimiento — aplicar un
 * scope global a un modelo que el propio guard de autenticación resuelve
 * es riesgo fuera de alcance de este módulo. `UserController` ya filtra
 * manualmente cada query por `empresa_id`; esta Policy es la segunda capa
 * de defensa (mismo principio que el resto del roadmap, "defensa en
 * profundidad"), nunca la única.
 *
 * Sin `create()`/`delete()` a propósito: no existen esas acciones en este
 * módulo (ver Decisión 1 en Users.md — creación es Módulo 6, eliminación
 * no existe nunca para Usuarios).
 */
class UserPolicy
{
    public function view(User $actor, User $usuario): bool
    {
        return $this->ownedBy($actor, $usuario);
    }

    public function update(User $actor, User $usuario): bool
    {
        return $this->ownedBy($actor, $usuario);
    }

    private function ownedBy(User $actor, User $usuario): bool
    {
        return $actor->is_platform_admin || $actor->empresa_id === $usuario->empresa_id;
    }
}
