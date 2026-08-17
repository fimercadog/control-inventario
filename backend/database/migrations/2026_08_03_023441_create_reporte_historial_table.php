<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Módulo Reportes — ampliación 2026-08-03 (centro de reportes
     * completo). Registro inmutable de cada vez que un reporte se generó
     * (preview) o exportó (pdf/excel/csv) — mismo espíritu que `AuditLog`
     * (solo `created_at`, sin `updated_at`), pero con propósito propio:
     * "qué reportes se consultaron y cuándo", no "qué acción de negocio
     * ocurrió". No duplica `audit_logs` — los 12 módulos que ya escriben
     * ahí siguen haciéndolo para sus propias acciones; esta tabla es
     * exclusiva de la actividad de este módulo.
     */
    public function up(): void
    {
        Schema::create('reporte_historial', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tipo_reporte');
            $table->string('formato');
            $table->json('filtros')->nullable();
            $table->unsignedInteger('total_filas')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('empresa_id');
            $table->index(['empresa_id', 'tipo_reporte']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reporte_historial');
    }
};
