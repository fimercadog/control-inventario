<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

/**
 * Catálogo global y fijo de permisos (docs/04_ARCHITECTURE.md, Módulo Auth &
 * RBAC). Solo se agregan permisos aquí al construir features nuevas; los
 * clientes gestionan roles, nunca este catálogo.
 */
class PermissionSeeder extends Seeder
{
    private const PERMISSIONS = [
        // Productos
        'productos.ver',
        'productos.crear',
        'productos.editar',
        'productos.eliminar',

        // Movimientos de inventario
        'movimientos.ver',
        'movimientos.crear',

        // Captura IA
        'captura-ia.usar',
        'captura-ia.revisar',
        'captura-ia.confirmar',

        // Usuarios (Módulo 4 — User Management)
        'usuarios.ver',
        'usuarios.editar',
        'usuarios.invitar',

        // Roles (Módulo 5 — Role Management)
        'roles.ver',
        'roles.gestionar',

        // Auditoría y seguridad (Módulo 8)
        'auditoria.ver',

        // Plataforma — exclusivo de is_platform_admin, nunca asignable
        // a un rol de empresa (ver docs/04_ARCHITECTURE.md).
        'plataforma.empresas.ver',
        'plataforma.usuarios.ver',
    ];

    public function run(): void
    {
        foreach (self::PERMISSIONS as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'api']);
        }
    }
}
