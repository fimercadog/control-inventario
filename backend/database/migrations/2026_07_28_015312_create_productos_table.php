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
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->string('codigo')->nullable();
            $table->string('codigo_barras')->nullable();
            $table->string('nombre');
            $table->string('marca')->nullable();
            $table->string('descripcion')->nullable();
            $table->string('presentacion')->nullable();
            $table->decimal('costo', 12, 2)->default(0);
            $table->decimal('precio', 12, 2)->default(0);
            $table->string('unidad_medida')->nullable();
            $table->decimal('stock_actual', 12, 2)->default(0);
            $table->decimal('stock_minimo', 12, 2)->default(0);
            $table->decimal('stock_maximo', 12, 2)->nullable();
            $table->string('imagen')->nullable();
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->index('empresa_id');
            $table->index('categoria_id');
            $table->index('nombre');
            $table->index('codigo');
            $table->index('codigo_barras');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};
