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
        Schema::table('movimientos', function (Blueprint $table) {
            // FEATURE-009 (docs/03_FUNCTIONAL_SPEC/Movements.md): borrado
            // siempre lógico (GLOBAL RULE, sesión 2026-07-29) — "anular" es
            // el único mecanismo de "eliminar" un movimiento. Nunca revierte
            // stock ni se borra la fila: stock_anterior/stock_nuevo siguen
            // siendo el registro inmutable de lo que ocurrió.
            $table->string('estado')->default('activo')->after('vencimiento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropColumn('estado');
        });
    }
};
