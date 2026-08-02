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

        // Categorías (Fase 4.5 — Authorization Alignment, docs/security/ROLES_MATRIX.md Gap 2)
        'categorias.ver',
        'categorias.crear',
        'categorias.editar',
        'categorias.gestionar',

        // Marcas (Fase 4.5)
        'marcas.ver',
        'marcas.crear',
        'marcas.editar',
        'marcas.gestionar',

        // Unidades de Medida (Fase 4.5)
        'unidades-medida.ver',
        'unidades-medida.crear',
        'unidades-medida.editar',
        'unidades-medida.gestionar',

        // Stock (Fase 4.5) — sin '.crear': Stock nunca se crea de forma
        // independiente, cada producto ya nace con sus propios campos.
        'stock.ver',
        'stock.editar',
        'stock.gestionar',

        // Proveedores (Fase 4.5)
        'proveedores.ver',
        'proveedores.crear',
        'proveedores.editar',
        'proveedores.gestionar',

        // Producto ↔ Proveedor (Fase 4.5) — namespace propio, distinto de
        // proveedores.* (es la asociación, no el proveedor en sí).
        'producto-proveedor.ver',
        'producto-proveedor.crear',
        'producto-proveedor.editar',
        'producto-proveedor.gestionar',

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
