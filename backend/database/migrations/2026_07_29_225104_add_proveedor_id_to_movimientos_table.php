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
     * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md): relación real
     * ahora que el módulo de Proveedores existe. Se conserva la columna
     * `proveedor` (texto libre, de FEATURE-002) para no perder los
     * registros ya creados antes de que este módulo existiera — nueva
     * lógica prioriza `proveedor_id` cuando está presente.
     */
    public function up(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->foreignId('proveedor_id')->nullable()->after('proveedor')
                ->constrained('proveedores')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('proveedor_id');
        });
    }
};
