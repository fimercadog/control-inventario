<?php

namespace App\Policies;

use App\Models\Categoria;
use App\Models\User;

/**
 * RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Categories.md). Mismo patrón que
 * ProveedorPolicy.
 *
 * Fase 4.5 (Authorization Alignment, docs/security/ROLES_MATRIX.md):
 * autorización = pertenencia de empresa Y permiso. `update()` gatea tanto
 * la edición real de campos como `enable()` (que reutiliza esta misma
 * ability, sin cambios de controller) — por eso su permiso es
 * `categorias.editar`, no `categorias.gestionar`. `delete()` gatea
 * únicamente `disable()`, con `categorias.gestionar` — la acción
 * administrativa más sensible del módulo.
 */
class CategoriaPolicy
{
    public function viewAny(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('categorias.ver');
    }

    public function create(User $user): bool
    {
        return ($user->is_platform_admin || $user->empresa_id !== null) && $user->can('categorias.crear');
    }

    public function view(User $user, Categoria $categoria): bool
    {
        return $this->ownedBy($user, $categoria) && $user->can('categorias.ver');
    }

    public function update(User $user, Categoria $categoria): bool
    {
        return $this->ownedBy($user, $categoria) && $user->can('categorias.editar');
    }

    public function delete(User $user, Categoria $categoria): bool
    {
        return $this->ownedBy($user, $categoria) && $user->can('categorias.gestionar');
    }

    private function ownedBy(User $user, Categoria $categoria): bool
    {
        return $user->is_platform_admin || $user->empresa_id === $categoria->empresa_id;
    }
}
