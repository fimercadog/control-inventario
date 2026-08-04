<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * ADR-015 (modelo de identidad ERP) clasifica `nit` como Identity en
 * Clientes y Proveedores. El propietario del proyecto pidió explícitamente
 * cerrar la brecha de unicidad documentada como riesgo abierto en esa
 * misma auditoría: UNIQUE + INDEX + validación backend + validación
 * frontend, las cuatro capas. Esta migración cierra la capa de base de
 * datos, reemplazando el índice compuesto no-único ya existente
 * (`[empresa_id, nit]`, creado junto con la tabla) por uno único sobre las
 * mismas columnas — mismo alcance que la unicidad ya existente de `email`
 * (por empresa, no global; dos empresas distintas sí pueden compartir un
 * NIT). Verificado antes de escribir esta migración: cero grupos
 * duplicados reales en los datos sembrados actuales (`php artisan
 * tinker`), así que no hace falta un paso de limpieza de datos primero.
 *
 * SQLite/MySQL permiten múltiples NULL en un índice único — un `nit` nulo
 * (el campo es `nullable`) nunca cuenta como conflicto consigo mismo ni
 * con otro `nit` nulo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'nit']);
            $table->unique(['empresa_id', 'nit']);
        });

        Schema::table('proveedores', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'nit']);
            $table->unique(['empresa_id', 'nit']);
        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropUnique(['empresa_id', 'nit']);
            $table->index(['empresa_id', 'nit']);
        });

        Schema::table('proveedores', function (Blueprint $table) {
            $table->dropUnique(['empresa_id', 'nit']);
            $table->index(['empresa_id', 'nit']);
        });
    }
};
