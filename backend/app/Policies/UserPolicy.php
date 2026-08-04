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
 *
 * `update()` (gatea activar/desactivar/asignarRol por igual, ver
 * `UserController`) exigía únicamente pertenencia de empresa hasta
 * 2026-08-04 — brecha documentada explícitamente en Users.md como
 * dependiente del Módulo 3 (Authorization/RBAC), sin construir en ese
 * momento. Módulo 3 se completó 2026-08-02 (`AuthorizationCompletion.md`);
 * esta Policy quedó como la única excepción real al modelo "permiso AND
 * pertenencia de empresa, nunca pertenencia sola" que ya rige las otras 9
 * Policies del ERP — cerrado en la auditoría de campos editables de
 * Clientes/Proveedores/Usuarios, 2026-08-04.
 */
class UserPolicy
{
    public function view(User $actor, User $usuario): bool
    {
        return $this->ownedBy($actor, $usuario);
    }

    public function update(User $actor, User $usuario): bool
    {
        return $this->ownedBy($actor, $usuario) && $actor->can('usuarios.editar');
    }

    private function ownedBy(User $actor, User $usuario): bool
    {
        return $actor->is_platform_admin || $actor->empresa_id === $usuario->empresa_id;
    }
}
