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
     * FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). No es un pivot
     * plano de Eloquent (belongsToMany estándar) porque tiene atributos
     * propios (es_principal, precio_compra, codigo_proveedor) y borrado
     * lógico vía `estado` — se modela como entidad propia
     * (ProductoProveedor), no como tabla pivot silenciosa.
     */
    public function up(): void
    {
        Schema::create('producto_proveedor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->foreignId('proveedor_id')->constrained('proveedores')->cascadeOnDelete();
            $table->boolean('es_principal')->default(false);
            $table->decimal('precio_compra', 12, 2)->nullable();
            $table->string('codigo_proveedor')->nullable();
            $table->string('estado')->default('activo');
            $table->timestamps();

            $table->unique(['producto_id', 'proveedor_id'], 'producto_proveedor_unico');
            $table->index('empresa_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('producto_proveedor');
    }
};
