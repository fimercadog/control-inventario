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
        Schema::create('capturas_ia_detalle', function (Blueprint $table) {
            $table->id();
            $table->foreignId('captura_id')->constrained('capturas_ia')->cascadeOnDelete();
            $table->foreignId('producto_id')->nullable()->constrained('productos')->nullOnDelete();
            $table->foreignId('movimiento_id')->nullable()->constrained('movimientos')->nullOnDelete();
            // Mapeo 1 a 1 con el contrato de IA products[]: name, brand, category, presentation, unit, quantity, confidence
            $table->string('nombre_detectado');
            $table->string('marca_detectado')->nullable();
            $table->string('categoria_detectado')->nullable();
            $table->string('presentacion_detectado')->nullable();
            $table->string('unidad_detectado')->nullable();
            $table->decimal('cantidad_detectada', 12, 2);
            $table->decimal('confianza', 4, 3);
            $table->boolean('es_producto_nuevo')->default(false);
            // Ver App\Enums\CapturaIA\EstadoCapturaDetalle
            $table->string('estado')->default('pendiente_revision');
            $table->timestamps();

            $table->index('producto_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('capturas_ia_detalle');
    }
};
