<?php

namespace App\Policies;

use App\Models\Producto;
use App\Models\User;

/**
 * Solo verifica pertenencia a la empresa (docs/04_ARCHITECTURE.md, Módulo 2
 * — Company Isolation). Aún no existe un endpoint REST de Productos (fuera
 * de alcance de este MVP); esta Policy protege el modelo desde ya para
 * cuando ese endpoint se construya, y para cualquier código interno
 * (Captura IA, Servicios) que resuelva un Producto por id.
 */
class ProductoPolicy
{
    /**
     * FEATURE-001 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2): sin
     * instancia de Producto todavía que verificar por pertenencia — solo
     * exige empresa resuelta (usuario de empresa, o Platform Super Admin
     * operando explícitamente en nombre de una). `empresa_id` real del
     * nuevo producto lo fuerza igualmente `BelongsToEmpresa` al crear.
     */
    public function create(User $user): bool
    {
        return $user->is_platform_admin || $user->empresa_id !== null;
    }

    public function view(User $user, Producto $producto): bool
    {
        return $this->ownedBy($user, $producto);
    }

    public function update(User $user, Producto $producto): bool
    {
        return $this->ownedBy($user, $producto);
    }

    public function delete(User $user, Producto $producto): bool
    {
        return $this->ownedBy($user, $producto);
    }

    private function ownedBy(User $user, Producto $producto): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $producto->empresa_id;
    }
}
