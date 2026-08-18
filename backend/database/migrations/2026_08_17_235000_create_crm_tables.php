<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('etapas_oportunidad', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->string('nombre');
            $table->unsignedSmallInteger('orden')->default(0);
            $table->unsignedTinyInteger('probabilidad')->default(0);
            $table->string('tipo')->default('abierta'); // abierta, ganada, perdida
            $table->boolean('estado')->default(true);
            $table->timestamps();
            $table->unique(['empresa_id', 'nombre']);
            $table->unique(['empresa_id', 'orden']);
        });

        Schema::create('contactos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->foreignId('responsable_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nombre');
            $table->string('apellido')->nullable();
            $table->string('email')->nullable();
            $table->string('telefono')->nullable();
            $table->string('cargo')->nullable();
            $table->string('origen')->nullable();
            $table->string('estado')->default('prospecto'); // prospecto, cliente, inactivo
            $table->text('notas')->nullable();
            $table->timestamp('convertido_at')->nullable();
            $table->timestamps();
            $table->index(['empresa_id', 'estado']);
            $table->index(['empresa_id', 'responsable_id']);
        });

        Schema::create('oportunidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('cliente_id')->constrained('clientes')->restrictOnDelete();
            $table->foreignId('contacto_id')->nullable()->constrained('contactos')->nullOnDelete();
            $table->foreignId('etapa_oportunidad_id')->constrained('etapas_oportunidad')->restrictOnDelete();
            $table->foreignId('responsable_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('nombre');
            $table->decimal('monto', 14, 2)->default(0);
            $table->unsignedTinyInteger('probabilidad')->default(0);
            $table->date('fecha_cierre_estimada')->nullable();
            $table->timestamp('ganada_at')->nullable();
            $table->timestamp('perdida_at')->nullable();
            $table->string('razon_perdida')->nullable();
            $table->text('descripcion')->nullable();
            $table->timestamps();
            $table->index(['empresa_id', 'etapa_oportunidad_id']);
            $table->index(['empresa_id', 'responsable_id']);
        });

        Schema::create('actividades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('cliente_id')->nullable()->constrained('clientes')->nullOnDelete();
            $table->foreignId('contacto_id')->nullable()->constrained('contactos')->nullOnDelete();
            $table->foreignId('oportunidad_id')->nullable()->constrained('oportunidades')->nullOnDelete();
            $table->foreignId('responsable_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('creado_por_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tipo')->default('tarea');
            $table->string('asunto');
            $table->text('descripcion')->nullable();
            $table->string('estado')->default('pendiente');
            $table->timestamp('programada_para')->nullable();
            $table->timestamp('completada_at')->nullable();
            $table->timestamps();
            $table->index(['empresa_id', 'estado', 'programada_para']);
            $table->index(['empresa_id', 'responsable_id']);
        });

        Schema::create('automatizaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->string('nombre');
            $table->string('evento');
            $table->json('filtros')->nullable();
            $table->json('acciones');
            $table->boolean('activa')->default(true);
            $table->timestamps();
            $table->index(['empresa_id', 'evento', 'activa']);
        });

        Schema::create('ejecuciones_automatizacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('automatizacion_id')->constrained('automatizaciones')->cascadeOnDelete();
            $table->string('evento');
            $table->string('entidad_tipo');
            $table->unsignedBigInteger('entidad_id');
            $table->string('clave_idempotencia');
            $table->string('estado')->default('completada');
            $table->json('resultado')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('ejecutada_at')->useCurrent();
            $table->unique(['automatizacion_id', 'clave_idempotencia']);
        });

        Schema::create('notificaciones_crm', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('tipo');
            $table->string('titulo');
            $table->text('mensaje')->nullable();
            $table->json('datos')->nullable();
            $table->timestamp('leida_at')->nullable();
            $table->timestamps();
            $table->index(['empresa_id', 'usuario_id', 'leida_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones_crm');
        Schema::dropIfExists('ejecuciones_automatizacion');
        Schema::dropIfExists('automatizaciones');
        Schema::dropIfExists('actividades');
        Schema::dropIfExists('oportunidades');
        Schema::dropIfExists('contactos');
        Schema::dropIfExists('etapas_oportunidad');
    }
};
