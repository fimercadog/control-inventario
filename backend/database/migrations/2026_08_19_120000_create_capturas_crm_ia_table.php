<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('capturas_crm_ia', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('entidad'); // contacto, oportunidad, actividad
            $table->text('contenido_original');
            $table->json('propuesta_ia');
            $table->string('proveedor_ia')->default('openai');
            $table->decimal('confianza', 4, 3)->nullable();
            $table->string('estado')->default('pendiente_revision');
            $table->string('entidad_creada_tipo')->nullable();
            $table->unsignedBigInteger('entidad_creada_id')->nullable();
            $table->timestamps();
            $table->index(['empresa_id', 'entidad', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('capturas_crm_ia');
    }
};
