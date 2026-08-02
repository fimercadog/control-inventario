<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 4.5 (Authorization Alignment, docs/security/ROLES_MATRIX.md gap 3)
 * y RC1 Fase 5 (Roles). El esquema por defecto de Spatie no trae ninguna
 * columna de estado en `roles`. Mismo patrón string `activo`/`inactivo`
 * ya usado en Categorías/Marcas/Unidades de Medida/Proveedores — no un
 * booleano, para mantener consistencia con el resto del ERP.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->string('estado')->default('activo')->after('guard_name');
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('estado');
        });
    }
};
