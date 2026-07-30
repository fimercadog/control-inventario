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
     * FEATURE-002 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2): campos
     * descriptivos del ingreso manual. No implementan inventario por lote
     * real — `stock_actual` sigue siendo un único acumulado por producto,
     * no separado por lote/vencimiento.
     */
    public function up(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->string('proveedor')->nullable()->after('documento');
            $table->string('lote')->nullable()->after('observacion');
            $table->date('vencimiento')->nullable()->after('lote');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropColumn(['proveedor', 'lote', 'vencimiento']);
        });
    }
};
