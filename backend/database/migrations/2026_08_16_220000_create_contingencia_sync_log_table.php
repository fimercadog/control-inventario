<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Modo Contingencia (docs/03_FUNCTIONAL_SPEC/ProductContingencyMode.md).
 * Ledger de idempotencia para el endpoint de sincronización — mismo
 * patrón exacto que `capturas_ia.idempotency_key` (ver
 * `2026_07_28_015313_create_capturas_ia_table.php`): un reintento del
 * mismo `operacion_id` (generado en el cliente al crear la operación
 * offline) nunca vuelve a tocar inventario. No es una entidad de
 * negocio nueva — es exclusivamente el registro de "esta operación ya
 * se procesó", separado de `movimientos`/`productos` a propósito para
 * no mezclar el concepto de "intento de sincronización" con el
 * resultado contable real.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contingencia_sync_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('usuario_id')->nullable()->constrained('users')->nullOnDelete();
            // uuid generado en el cliente al crear la operación offline —
            // también es el valor que viaja en el header Idempotency-Key.
            $table->uuid('operacion_id');
            $table->string('tipo'); // 'crear' | 'actualizar' — ver App\Enums\Contingencia\TipoOperacionContingencia
            $table->foreignId('producto_id')->nullable()->constrained('productos')->nullOnDelete();
            $table->timestamp('procesado_at');
            $table->timestamps();

            $table->unique(['empresa_id', 'operacion_id']);
            $table->index('producto_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contingencia_sync_log');
    }
};
