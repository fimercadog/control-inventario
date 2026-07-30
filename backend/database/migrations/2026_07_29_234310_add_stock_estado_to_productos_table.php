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
        Schema::table('productos', function (Blueprint $table) {
            // FEATURE-008 (docs/03_FUNCTIONAL_SPEC/Stock.md). Independiente
            // de `productos.estado` (catálogo) a propósito: deshabilitar el
            // registro de Stock de un producto (ocultarlo del módulo Stock)
            // nunca debe afectar si el producto sigue siendo un producto de
            // catálogo válido en otros módulos (Captura IA, Proveedores,
            // Movimientos). Nunca se usa para revertir cantidades.
            $table->string('stock_estado')->default('activo')->after('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn('stock_estado');
        });
    }
};
