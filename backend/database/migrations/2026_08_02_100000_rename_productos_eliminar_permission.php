<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Fase 4.6 (Authorization Completion, docs/security/ROLES_MATRIX.md).
 * `productos.eliminar` nunca reflejó el comportamiento real (Productos
 * nunca hace un DELETE físico, solo activa/desactiva) — inconsistencia ya
 * señalada en Fase 4.5 como "a evaluar aparte". Renombrado a
 * `productos.gestionar`, mismo verbo que los 6 módulos alineados en esa
 * fase. `UPDATE` en vez de borrar+crear: preserva el `id` de la fila, así
 * que cualquier `role_has_permissions`/`model_has_permissions` que ya
 * apuntara a este permiso sigue apuntando al mismo permiso, ahora con
 * otro nombre — ningún rol pierde el acceso que ya tenía.
 *
 * Verificado antes de escribir esta migración: ningún Policy, test, ni
 * seeder de rol referencia el string 'productos.eliminar' fuera de
 * `PermissionSeeder` (que se actualiza en el mismo commit) — solo el rol
 * "Administrador" lo tenía, vía `Permission::all()` dinámico, no por
 * nombre explícito.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('permissions')
            ->where('name', 'productos.eliminar')
            ->where('guard_name', 'api')
            ->update(['name' => 'productos.gestionar']);
    }

    public function down(): void
    {
        DB::table('permissions')
            ->where('name', 'productos.gestionar')
            ->where('guard_name', 'api')
            ->update(['name' => 'productos.eliminar']);
    }
};
