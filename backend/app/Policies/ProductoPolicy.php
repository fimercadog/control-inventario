<?php

namespace App\Policies;

use App\Models\Producto;
use App\Models\User;

/**
 * Fase 4.6 (Authorization Completion, docs/security/ROLES_MATRIX.md):
 * autorización = pertenencia de empresa Y permiso — mismo estándar que el
 * resto del ERP desde Fase 4.5. `update()` gatea tanto la edición real de
 * campos como `registrarIngreso()`/`enable()` (reutilizan esta misma
 * ability, sin cambios de controller), por eso usa `productos.editar`.
 * `delete()` gatea únicamente `disable()`, con `productos.gestionar`
 * (renombrado desde `productos.eliminar` en esta misma fase — Productos
 * nunca hace un DELETE físico, solo activa/desactiva).
 *
 * `StockController` opera sobre este mismo modelo pero usa `StockPolicy`,
 * una clase separada (Fase 4.5) — nunca mezclar ambos permisos aquí.
 */
class ProductoPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('productos.ver');
    }

    /**
     * FEATURE-001 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2): sin
     * instancia de Producto todavía que verificar por pertenencia — solo
     * exige empresa resuelta (usuario de empresa, o Platform Super Admin
     * operando explícitamente en nombre de una). `empresa_id` real del
     * nuevo producto lo fuerza igualmente `BelongsToEmpresa` al crear.
     */
    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('productos.crear');
    }

    public function view(User $user, Producto $producto): bool
    {
        return $this->ownedBy($user, $producto) && $user->can('productos.ver');
    }

    public function update(User $user, Producto $producto): bool
    {
        return $this->ownedBy($user, $producto) && $user->can('productos.editar');
    }

    public function delete(User $user, Producto $producto): bool
    {
        return $this->ownedBy($user, $producto) && $user->can('productos.gestionar');
    }

    private function ownedBy(User $user, Producto $producto): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $producto->empresa_id;
    }
}
