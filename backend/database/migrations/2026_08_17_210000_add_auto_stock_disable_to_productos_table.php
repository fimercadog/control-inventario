<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Distingue un producto agotado automáticamente de uno que un
            // administrador deshabilitó por decisión de catálogo.
            $table->boolean('inhabilitado_por_stock')->default(false)->after('estado');
        });
    }

    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn('inhabilitado_por_stock');
        });
    }
};
