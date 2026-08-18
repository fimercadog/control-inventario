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
                'usuarios.ver', 'usuarios.editar', 'usuarios.invitar', 'auditoria.ver', 'reportes.ver', 'reportes.gestionar',
                'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.gestionar',
                'contactos.ver', 'contactos.crear', 'contactos.editar', 'contactos.convertir',
                'oportunidades.ver', 'oportunidades.crear', 'oportunidades.editar', 'oportunidades.gestionar',
                'actividades.ver', 'actividades.crear', 'actividades.editar', 'actividades.completar',
                'automatizaciones.ver', 'automatizaciones.gestionar',
            ],
            'Bodeguero' => [
                'productos.ver', 'movimientos.ver', 'movimientos.crear',
                'captura-ia.usar', 'captura-ia.revisar',
            ],
            'Vendedor' => [
                'productos.ver', 'movimientos.ver',
                'clientes.ver', 'clientes.crear', 'clientes.editar',
                'contactos.ver', 'contactos.crear', 'contactos.editar', 'contactos.convertir',
                'oportunidades.ver', 'oportunidades.crear', 'oportunidades.editar',
                'actividades.ver', 'actividades.crear', 'actividades.editar', 'actividades.completar',
            ],
            'Auxiliar Contable' => [
                'productos.ver', 'auditoria.ver', 'reportes.ver', 'clientes.ver',
            ],
        ];

        $roles = [];

        foreach ($definiciones as $nombre => $nombresPermisos) {
            // ADR-019: sin EmpresaScope, un firstOrCreate() sin empresa_id
            // en el criterio de búsqueda encontraría (y le robaría) el rol
            // ya creado para OTRA empresa en una corrida previa de este
            // mismo bucle — empresa_id va en el criterio, no solo asignado
            // después de crear.
            $rol = Role::firstOrCreate([
                'name' => $nombre,
                'guard_name' => 'api',
                'empresa_id' => $empresa->id,
            ]);

            // `$permisos` es un Eloquent\Collection (viene de ::get()) — su
            // only() está sobreescrito para filtrar por PRIMARY KEY, no por
            // las claves de keyBy('name'). Sin toBase(), esto silenciosamente
            // devuelve una colección vacía (ningún permiso es un id numérico
            // igual a un nombre de permiso) y syncPermissions() limpia el rol
            // en vez de asignarle los permisos correctos — bug real
            // encontrado el 2026-08-02 construyendo el módulo Reportes.
            $rol->syncPermissions($permisos->toBase()->only($nombresPermisos)->values());

            $roles[$nombre] = $rol;
        }

        return $roles;
    }
}
