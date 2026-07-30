<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Demo Data RC1. Crea usuarios adicionales de una empresa y les asigna un
 * rol real (de los ya creados por RoleSeeder) — nunca usuarios sin rol,
 * para que el bloque de usuario del sidebar y cualquier filtro por rol
 * tengan datos creíbles.
 */
class UserSeeder extends Seeder
{
    /**
     * @param array<string, Role> $roles
     */
    public function crear(Empresa $empresa, array $roles, int $cantidad): Collection
    {
        $nombresRoles = array_keys($roles);

        $usuarios = User::factory()
            ->count($cantidad)
            ->create(['empresa_id' => $empresa->id]);

        $usuarios->each(function (User $usuario) use ($roles, $nombresRoles) {
            $rol = $roles[$nombresRoles[array_rand($nombresRoles)]];
            $usuario->assignRole($rol);
        });

        return $usuarios;
    }
}
