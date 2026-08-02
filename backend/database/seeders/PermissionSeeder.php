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
        // Productos (Fase 4.6 — Authorization Completion: 'eliminar' pasó a
        // 'gestionar' vía migración dedicada, mismo verbo que el resto del
        // ERP para activar/desactivar — nunca hay un DELETE físico).
        'productos.ver',
        'productos.crear',
        'productos.editar',
        'productos.gestionar',

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

        // Clientes (2026-08-02) — mismo patrón que Proveedores.
        'clientes.ver',
        'clientes.crear',
        'clientes.editar',
        'clientes.gestionar',

        // Producto ↔ Proveedor (Fase 4.5) — namespace propio, distinto de
        // proveedores.* (es la asociación, no el proveedor en sí).
        'producto-proveedor.ver',
        'producto-proveedor.crear',
        'producto-proveedor.editar',
        'producto-proveedor.gestionar',

        // Movimientos de inventario
        'movimientos.ver',
        'movimientos.crear',

        // Captura IA (captura-ia.gestionar agregado en Fase 4.6 — sembrado
        // para configuración futura, sin ninguna acción real que lo
        // consuma todavía, mismo patrón que roles.gestionar/usuarios.invitar).
        'captura-ia.usar',
        'captura-ia.revisar',
        'captura-ia.confirmar',
        'captura-ia.gestionar',

        // Usuarios (Módulo 4 — User Management)
        'usuarios.ver',
        'usuarios.editar',
        'usuarios.invitar',

        // Roles (Módulo 5 — Role Management)
        'roles.ver',
        'roles.gestionar',

        // Auditoría y seguridad (Módulo 8)
        'auditoria.ver',

        // Reportes (2026-08-02) — estadísticas agregadas de solo lectura
        // sobre Productos/Inventario/Movimientos/Clientes/Proveedores.
        // Un único permiso, mismo patrón que auditoria.ver: no hay nada
        // que "gestionar" en un módulo 100% de solo lectura.
        'reportes.ver',

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
