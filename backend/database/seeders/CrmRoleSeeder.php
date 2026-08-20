<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/**
 * Roles comerciales explícitos para el módulo CRM.
 *
 * Se mantienen separados de los roles transversales existentes (Vendedor y
 * Supervisor) para que la pantalla de Roles comunique claramente quién opera
 * el CRM. Es idempotente: puede ejecutarse en una base ya poblada sin duplicar
 * roles ni modificar usuarios asignados.
 */
class CrmRoleSeeder extends Seeder
{
    public function run(): void
    {
        $permisos = Permission::query()
            ->where('guard_name', 'api')
            ->get()
            ->keyBy('name');

        $definiciones = [
            'Gestor CRM' => [
                'clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.gestionar',
                'contactos.ver', 'contactos.crear', 'contactos.editar', 'contactos.convertir',
                'oportunidades.ver', 'oportunidades.crear', 'oportunidades.editar', 'oportunidades.gestionar',
                'actividades.ver', 'actividades.crear', 'actividades.editar', 'actividades.completar',
                'automatizaciones.ver', 'automatizaciones.gestionar',
                'reportes.ver',
            ],
            'Asesor CRM' => [
                'clientes.ver', 'clientes.crear', 'clientes.editar',
                'contactos.ver', 'contactos.crear', 'contactos.editar', 'contactos.convertir',
                'oportunidades.ver', 'oportunidades.crear', 'oportunidades.editar',
                'actividades.ver', 'actividades.crear', 'actividades.editar', 'actividades.completar',
            ],
        ];

        foreach (Empresa::query()->get() as $empresa) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($empresa->id);

            foreach ($definiciones as $nombre => $nombresPermisos) {
                $rol = Role::firstOrCreate([
                    'name' => $nombre,
                    'guard_name' => 'api',
                    'empresa_id' => $empresa->id,
                ], ['estado' => 'activo']);

                $rol->syncPermissions($permisos->toBase()->only($nombresPermisos)->values());
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
