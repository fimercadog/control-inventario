<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * RC1 Fase 1 (docs/05_IMPLEMENTATION/CatalogModules.md, "Catalog
 * Normalization" aprobado 2026-07-29): `marca`/`unidad_medida` dejan de
 * ser texto libre. Cada valor distinto (case-insensitive, trim) por
 * empresa se convierte en una fila real de `marcas`/`unidades_medida`
 * antes de eliminar las columnas string — ningún dato existente se pierde,
 * solo se normaliza.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->foreignId('marca_id')->nullable()->after('marca')->constrained('marcas')->nullOnDelete();
            $table->foreignId('unidad_medida_id')->nullable()->after('unidad_medida')->constrained('unidades_medida')->nullOnDelete();
        });

        $this->backfillCatalogo('marca', 'marca_id', 'marcas');
        $this->backfillCatalogo('unidad_medida', 'unidad_medida_id', 'unidades_medida');

        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn(['marca', 'unidad_medida']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * Best-effort: recrea las columnas string vacías. No es reversible sin
     * pérdida de formato original (aceptable en esta etapa RC1, sin datos
     * de producción reales todavía).
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropForeign(['marca_id']);
            $table->dropForeign(['unidad_medida_id']);
            $table->dropColumn(['marca_id', 'unidad_medida_id']);
            $table->string('marca')->nullable();
            $table->string('unidad_medida')->nullable();
        });
    }

    private function backfillCatalogo(string $columnaOrigen, string $columnaFk, string $tablaCatalogo): void
    {
        $pares = DB::table('productos')
            ->select('empresa_id', $columnaOrigen)
            ->whereNotNull($columnaOrigen)
            ->where($columnaOrigen, '!=', '')
            ->distinct()
            ->get();

        foreach ($pares as $par) {
            $valor = trim($par->{$columnaOrigen});

            if ($valor === '') {
                continue;
            }

            $existente = DB::table($tablaCatalogo)
                ->where('empresa_id', $par->empresa_id)
                ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($valor)])
                ->first();

            $catalogoId = $existente->id ?? DB::table($tablaCatalogo)->insertGetId([
                'empresa_id' => $par->empresa_id,
                'nombre' => $valor,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('productos')
                ->where('empresa_id', $par->empresa_id)
                ->whereRaw('LOWER('.$columnaOrigen.') = ?', [mb_strtolower($valor)])
                ->update([$columnaFk => $catalogoId]);
        }
    }
};
