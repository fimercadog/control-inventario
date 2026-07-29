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
        Schema::create('capturas_ia', function (Blueprint $table) {
            $table->id();
            // Identificador externo estable para apps móviles e integraciones;
            // el id numérico nunca se expone fuera del backend (sección 74, punto 6).
            $table->uuid('uuid')->unique();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            // Protección de idempotencia (sección 74, punto 4): un reintento de
            // red/navegador/app móvil con la misma clave nunca vuelve a tocar
            // inventario. Nula = sin protección (cliente no mandó la clave).
            // Única por empresa: SQLite y MySQL permiten múltiples NULL en un
            // índice único, así que no exige la clave a quien no la manda.
            $table->string('idempotency_key')->nullable();
            // 'tipo' se valida a nivel de aplicación con App\Enums\CapturaIA\TipoCaptura (VARCHAR, no ENUM de MySQL)
            // para poder agregar tipos futuros (codigo_barras, qr, ocr_factura, pdf, video) sin migración.
            $table->string('tipo');
            // Archivo ORIGINAL (no procesado) guardado tal cual llegó, para
            // auditoría (sección 74, punto 4). archivo_path es el principal
            // (imagen en Foto/Foto+Voz, audio en Voz); archivo_secundario_path
            // es el audio en Foto+Voz.
            $table->string('archivo_path')->nullable();
            $table->string('archivo_secundario_path')->nullable();
            $table->string('archivo_mime')->nullable();
            $table->text('transcripcion')->nullable();
            $table->json('respuesta_ia_json')->nullable();
            $table->string('proveedor_ia')->default('openai');
            $table->unsignedInteger('tiempo_procesamiento_ms')->nullable();
            $table->string('movimiento_tipo')->default('entrada');
            $table->decimal('confianza_promedio', 4, 3)->nullable();
            // Ver App\Enums\CapturaIA\EstadoCaptura. 'procesando' es el estado
            // transitorio cuando el procesamiento corre en cola (punto 8);
            // hoy el pipeline es síncrono y nunca deja una captura en ese estado.
            $table->string('estado')->default('pendiente_revision');
            $table->timestamps();

            $table->index('empresa_id');
            $table->index('estado');
            $table->index('tipo');
            $table->unique(['empresa_id', 'idempotency_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('capturas_ia');
    }
};
