<?php

namespace App\Policies;

use App\Models\ProductoProveedor;
use App\Models\User;

/**
 * FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Mismo patrón que
 * ProductoPolicy/ProveedorPolicy.
 *
 * Fase 4.5 (Authorization Alignment, docs/security/ROLES_MATRIX.md):
 * autorización = pertenencia de empresa Y permiso, namespace propio
 * `producto-proveedor.*` (distinto de `proveedores.*` — es la asociación,
 * no el proveedor en sí). No hay `enable()` en este módulo (nunca se
 * construyó esa ruta), así que `update()` gatea únicamente la edición real
 * (precio/código/proveedor principal) — `producto-proveedor.editar` no
 * hereda la ambigüedad que sí tienen Categorías/Marcas/Proveedores/UM.
 */
class ProductoProveedorPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('producto-proveedor.ver');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('producto-proveedor.crear');
    }

    public function view(User $user, ProductoProveedor $asociacion): bool
    {
        return $this->ownedBy($user, $asociacion) && $user->can('producto-proveedor.ver');
    }

    public function update(User $user, ProductoProveedor $asociacion): bool
    {
        return $this->ownedBy($user, $asociacion) && $user->can('producto-proveedor.editar');
    }

    public function delete(User $user, ProductoProveedor $asociacion): bool
    {
        return $this->ownedBy($user, $asociacion) && $user->can('producto-proveedor.gestionar');
    }

    private function ownedBy(User $user, ProductoProveedor $asociacion): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $asociacion->empresa_id;
    }
}
