<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contingencia_actividades_sync_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('operacion_id');
            $table->foreignId('actividad_id')->nullable()->constrained('actividades')->nullOnDelete();
            $table->timestamp('procesado_at');
            $table->timestamps();
            $table->unique(['empresa_id', 'operacion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contingencia_actividades_sync_log');
    }
};
