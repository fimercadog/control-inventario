<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Sin `deleted_at`
     * a propósito — sigue la convención ya establecida en el proyecto
     * (`Producto`, `Categoria`) de un campo `estado` (activo/inactivo)
     * para el borrado lógico, no Eloquent SoftDeletes.
     */
    public function up(): void
    {
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->string('nombre');
            $table->string('nit')->nullable();
            $table->string('contacto')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('direccion')->nullable();
            $table->string('ciudad')->nullable();
            $table->string('pais')->nullable();
            $table->text('notas')->nullable();
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->index('empresa_id');
            $table->index(['empresa_id', 'nit']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proveedores');
    }
};
