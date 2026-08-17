<?php

namespace App\Policies;

use App\Models\Producto;
use App\Models\User;

/**
 * Fase 4.5 (Authorization Alignment, docs/security/ROLES_MATRIX.md).
 *
 * Stock opera sobre `Producto` (mismo modelo, no es una entidad
 * independiente — ver `docs/03_FUNCTIONAL_SPEC/Stock.md`), pero Laravel
 * resuelve Policies por clase de modelo: si el chequeo de permiso de
 * Stock viviera dentro de `ProductoPolicy`, gatearía también las propias
 * acciones de `ProductoController` con el permiso equivocado (`stock.*`
 * en vez de `productos.*`). Por eso Stock tiene su propia Policy, y
 * `StockController` la invoca directamente (inyectada) en vez de usar el
 * helper `$this->authorize('ability', $producto)`, que siempre resolvería
 * a `ProductoPolicy` por ser `$producto` una instancia de `Producto`.
 *
 * Sin `create()` a propósito: Stock nunca se crea de forma independiente.
 */
class StockPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('stock.ver');
    }

    public function view(User $user, Producto $producto): bool
    {
        return $this->ownedBy($user, $producto) && $user->can('stock.ver');
    }

    public function update(User $user, Producto $producto): bool
    {
        return $this->ownedBy($user, $producto) && $user->can('stock.editar');
    }

    public function delete(User $user, Producto $producto): bool
    {
        return $this->ownedBy($user, $producto) && $user->can('stock.gestionar');
    }

    private function ownedBy(User $user, Producto $producto): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $producto->empresa_id;
    }
}
