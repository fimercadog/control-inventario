<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Segunda pasada de la auditoría de índices de FK (ver
 * 2026_08_18_090000_add_missing_fk_indexes.php), ahora sobre las tablas
 * periféricas (auditoría, seguridad, captura IA, reportes, invitaciones)
 * que quedaron fuera de esa primera pasada. audit_logs (11k+ filas) y
 * security_logs (14.9k+ filas) son las de mayor volumen y crecimiento
 * indefinido — sin índice en su columna de usuario, cualquier pantalla
 * de "actividad de este usuario" hace table scan completo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['empresa_id', 'usuario_id']);
        });

        Schema::table('security_logs', function (Blueprint $table) {
            $table->index('user_id');
        });

        Schema::table('capturas_ia', function (Blueprint $table) {
            $table->index(['empresa_id', 'usuario_id']);
        });

        Schema::table('reporte_historial', function (Blueprint $table) {
            $table->index(['empresa_id', 'usuario_id']);
        });

        Schema::table('reportes_programados', function (Blueprint $table) {
            $table->index(['empresa_id', 'usuario_id']);
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->index('invited_by');
            $table->index('role_id');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('invited_by');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'usuario_id']);
        });

        Schema::table('security_logs', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('capturas_ia', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'usuario_id']);
        });

        Schema::table('reporte_historial', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'usuario_id']);
        });

        Schema::table('reportes_programados', function (Blueprint $table) {
            $table->dropIndex(['empresa_id', 'usuario_id']);
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropIndex(['invited_by']);
            $table->dropIndex(['role_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['invited_by']);
        });
    }
};
