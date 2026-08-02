<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

/**
 * Demo Data RC1 (docs/06_TESTS/DemoDataAudit.md). Crea el catálogo de roles
 * de una empresa con permisos realmente distintos entre sí — no todos
 * "Administrador" — para poder probar filtros/paginación/permisos con
 * datos creíbles. `empresa_id` se fija a mano en cada Role porque
 * DatabaseSeeder usa WithoutModelEvents (el hook de BelongsToEmpresa no
 * corre durante el seeding).
 */
class RoleSeeder extends Seeder
{
    /**
     * @return array<string, Role> roles creados, indexados por nombre
     */
    public function crear(Empresa $empresa): array
    {
        $permisos = Permission::where('guard_name', 'api')->get()->keyBy('name');

        $definiciones = [
            'Administrador' => $permisos->keys()->all(),
            'Supervisor' => [
                'productos.ver', 'productos.crear', 'productos.editar',
                'movimientos.ver', 'movimientos.crear',
                'captura-ia.usar', 'captura-ia.revisar', 'captura-ia.confirmar',
                'usuarios.ver', 'auditoria.ver',
                'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.gestionar',
            ],
            'Bodeguero' => [
                'productos.ver', 'movimientos.ver', 'movimientos.crear',
                'captura-ia.usar', 'captura-ia.revisar',
            ],
            'Vendedor' => [
                'productos.ver', 'movimientos.ver',
                'clientes.ver', 'clientes.crear', 'clientes.editar',
            ],
            'Auxiliar Contable' => [
                'productos.ver', 'auditoria.ver', 'clientes.ver',
            ],
        ];

        $roles = [];

        foreach ($definiciones as $nombre => $nombresPermisos) {
            $rol = Role::firstOrCreate(['name' => $nombre, 'guard_name' => 'api']);
            $rol->empresa_id = $empresa->id;
            $rol->save();

            $rol->syncPermissions($permisos->only($nombresPermisos)->values());

            $roles[$nombre] = $rol;
        }

        return $roles;
    }
}
