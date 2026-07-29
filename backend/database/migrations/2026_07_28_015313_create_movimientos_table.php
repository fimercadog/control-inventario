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
        Schema::create('movimientos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tipo');
            $table->string('documento')->nullable();
            $table->decimal('cantidad', 12, 2);
            $table->decimal('stock_anterior', 12, 2);
            $table->decimal('stock_nuevo', 12, 2);
            $table->decimal('costo', 12, 2)->nullable();
            $table->decimal('precio', 12, 2)->nullable();
            $table->string('observacion')->nullable();
            $table->timestamps();

            $table->index('empresa_id');
            $table->index('producto_id');
            $table->index('tipo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movimientos');
    }
};
