<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            // Módulo/acción genéricos (sección 61 del master spec): esta tabla
            // no es exclusiva de Captura IA, cualquier módulo futuro puede
            // escribir aquí sus propios eventos de auditoría.
            $table->string('modulo');
            $table->string('accion');
            // Referencia polimórfica al registro auditado (ej. capturas_ia).
            $table->nullableMorphs('auditable');
            $table->json('valores_anteriores')->nullable();
            $table->json('valores_nuevos')->nullable();
            $table->string('resultado')->nullable();
            $table->string('ip')->nullable();
            $table->string('user_agent')->nullable();
            // Solo created_at: la auditoría es inmutable, nunca se actualiza
            // (sección 61, "Nunca podrá modificarse. Nunca podrá eliminarse.").
            $table->timestamp('created_at')->useCurrent();

            $table->index('empresa_id');
            $table->index(['modulo', 'accion']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
