<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQLite (y Laravel's foreignId()->constrained()) no crea un índice
 * automáticamente para cada FK, a diferencia de lo que muchos asumen.
 * Auditoría vs. el archivo .sqlite real (PRAGMA foreign_key_list +
 * PRAGMA index_list por tabla) encontró columnas de FK sin ningún índice
 * que las cubra, incluyendo `users.empresa_id` y
 * `ejecuciones_automatizacion.empresa_id` — la propia columna de
 * aislamiento por tenant, ausente justo en las dos tablas donde el resto
 * de sus tablas hermanas sí la tienen indexada.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->index('empresa_id');
        });

        Schema::table('ejecuciones_automatizacion', function (Blueprint $table) {
            $table->index('empresa_id');
        });

        Schema::table('contactos', function (Blueprint $table) {
            $table->index(['empresa_id', 'cliente_id']);
        });

        Schema::table('oportunidades', function (Blueprint $table) {
            $table->index(['empresa_id', 'cliente_id']);
            $table->index(['empresa_id', 'contacto_id']);
        });

        Schema::table('actividades', function (Blueprint $table) {
            $table->index(['empresa_id', 'cliente_id']);
            $table->index(['empresa_id', 'contacto_id']);
            $table->index(['empresa_id', 'oportunidad_id']);
            $table->index(['empresa_id', 'creado_por_id']);
        });

        Schema::table('movimientos', function (Blueprint $table) {
            $table->index(['empresa_id', 'usuario_id']);
            $table->index(['empresa_id', 'proveedor_id']);
        });

        Schema::table('contingencia_sync_log', function (Blueprint $table) {
            $table->index(['empresa_id', 'usuario_id']);
        });

        Schema::table('contingencia_actividades_sync_log', function (Blueprint $table) {
            $table->index(['empresa_id', 'actividad_id']);
            $table->index(['empresa_id', 'usuario_id']);
        });

        Schema::table('productos', function (Blueprint $table) {
            $table->index('marca_id');
            $table->index('unidad_medida_id');
        });

        Schema::table('capturas_ia_detalle', function (Blueprint $table) {
            $table->index('captura_id');
            $table->index('movimiento_id');
        });

        Schema::table('producto_proveedor', function (Blueprint $table) {
            $table->index('proveedor_id');
        });

        Schema::table('marca_proveedor', function (Blueprint $table) {
            $table->index('proveedor_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['empresa_id']);
        });

        Schema::table('ejecuciones_automatizacion', function (Blueprint $table) {
            $table->dropIndex(['empresa_id']);
        });

        Schema::table('contactos', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'cliente_id']);
        });

        Schema::table('oportunidades', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'cliente_id']);
            $table->dropIndex(['empresa_id', 'contacto_id']);
        });

        Schema::table('actividades', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'cliente_id']);
            $table->dropIndex(['empresa_id', 'contacto_id']);
            $table->dropIndex(['empresa_id', 'oportunidad_id']);
            $table->dropIndex(['empresa_id', 'creado_por_id']);
        });

        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'usuario_id']);
            $table->dropIndex(['empresa_id', 'proveedor_id']);
        });

        Schema::table('contingencia_sync_log', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'usuario_id']);
        });

        Schema::table('contingencia_actividades_sync_log', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'actividad_id']);
            $table->dropIndex(['empresa_id', 'usuario_id']);
        });

        Schema::table('productos', function (Blueprint $table) {
            $table->dropIndex(['marca_id']);
            $table->dropIndex(['unidad_medida_id']);
        });

        Schema::table('capturas_ia_detalle', function (Blueprint $table) {
            $table->dropIndex(['captura_id']);
            $table->dropIndex(['movimiento_id']);
        });

        Schema::table('producto_proveedor', function (Blueprint $table) {
            $table->dropIndex(['proveedor_id']);
        });

        Schema::table('marca_proveedor', function (Blueprint $table) {
            $table->dropIndex(['proveedor_id']);
        });
    }
};
