<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Módulo Reportes — ampliación 2026-08-03. Infraestructura
     * "future-ready" a propósito: define QUÉ se programaría (reporte +
     * filtros + frecuencia + formato + destinatarios), pero no existe
     * ningún motor que la ejecute todavía — `ultima_ejecucion_at` queda
     * siempre `null` hasta que ese motor se construya. Mismo patrón que
     * `captura-ia.gestionar` (sembrado, sin consumidor real todavía).
     */
    public function up(): void
    {
        Schema::create('reportes_programados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nombre');
            $table->string('tipo_reporte');
            $table->json('filtros')->nullable();
            $table->string('formato');
            $table->string('frecuencia');
            $table->json('destinatarios')->nullable();
            $table->string('estado')->default('activo');
            $table->timestamp('ultima_ejecucion_at')->nullable();
            $table->timestamp('proxima_ejecucion_at')->nullable();
            $table->timestamps();

            $table->index('empresa_id');
            $table->index(['empresa_id', 'estado']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportes_programados');
    }
};
