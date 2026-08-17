<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Modelo de negocio (WO "Modelo de base de datos", 2026-08-17): una
     * marca puede tener varios proveedores y un proveedor puede trabajar
     * con varias marcas. Sin atributos propios (a diferencia de
     * producto_proveedor, que sí tiene es_principal/precio_compra/
     * codigo_proveedor) — aun así se modela como entidad propia
     * (MarcaProveedor), no como belongsToMany plano, para mantener el
     * mismo criterio de auto-asignación de empresa_id vía BelongsToEmpresa
     * que ya usa ProductoProveedor.
     */
    public function up(): void
    {
        Schema::create('marca_proveedor', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('marca_id')->constrained('marcas')->cascadeOnDelete();
            $table->foreignId('proveedor_id')->constrained('proveedores')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['marca_id', 'proveedor_id'], 'marca_proveedor_unico');
            $table->index('empresa_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('marca_proveedor');
    }
};
