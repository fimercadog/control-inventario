<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Punto 8 del review de diagrama-bd.md: no existe bodega/ubicación,
 * `productos.stock_actual` es un único saldo global (MVP de un solo
 * almacén, documentado a propósito en InventoryService).
 *
 * Esta migración es SOLO la base estructural (fase "expand" de un
 * expand-contract seguro): crea `bodegas` y `producto_bodega`, agrega
 * `bodega_id` (nullable) a `movimientos`, y hace backfill copiando —
 * nunca moviendo — los datos existentes a una bodega "Principal" por
 * empresa. `productos.stock_actual` NO se toca, NO se elimina ninguna
 * columna, y ningún registro existente se borra o modifica en su
 * contenido de negocio.
 *
 * Deliberadamente NO reescribe InventoryService, controllers ni
 * frontend para operar por bodega — eso es una fase aparte (rediseñar
 * el camino de escritura de stock es riesgo alto sobre lógica de
 * negocio ya probada) que requiere su propia validación antes de
 * tocarse. Hasta que esa fase exista, `productos.stock_actual` sigue
 * siendo la única fuente de verdad operativa; `producto_bodega` queda
 * poblado y consistente, listo para que esa fase lo consuma.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bodegas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->string('nombre');
            $table->boolean('es_principal')->default(false);
            $table->string('estado')->default('activo');
            $table->timestamps();
            $table->unique(['empresa_id', 'nombre']);
        });

        Schema::create('producto_bodega', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->foreignId('bodega_id')->constrained('bodegas')->cascadeOnDelete();
            $table->decimal('stock_actual', 12, 2)->default(0);
            $table->timestamps();
            $table->unique(['producto_id', 'bodega_id']);
            $table->index(['empresa_id', 'bodega_id']);
        });

        Schema::table('movimientos', function (Blueprint $table) {
            $table->foreignId('bodega_id')->nullable()->after('producto_id')->constrained('bodegas')->nullOnDelete();
        });

        $totalProductosAntes = DB::table('productos')->count();
        $sumaStockAntes = (float) DB::table('productos')->sum('stock_actual');
        $totalMovimientosAntes = DB::table('movimientos')->count();

        $empresas = DB::table('empresas')->pluck('id');
        $bodegaPrincipalPorEmpresa = [];

        foreach ($empresas as $empresaId) {
            $bodegaId = DB::table('bodegas')->insertGetId([
                'empresa_id' => $empresaId,
                'nombre' => 'Principal',
                'es_principal' => true,
                'estado' => 'activo',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $bodegaPrincipalPorEmpresa[$empresaId] = $bodegaId;
        }

        DB::table('productos')->select('id', 'empresa_id', 'stock_actual')->orderBy('id')
            ->chunk(500, function ($productos) use ($bodegaPrincipalPorEmpresa) {
                $now = now();
                $filas = [];
                foreach ($productos as $producto) {
                    $filas[] = [
                        'empresa_id' => $producto->empresa_id,
                        'producto_id' => $producto->id,
                        'bodega_id' => $bodegaPrincipalPorEmpresa[$producto->empresa_id],
                        'stock_actual' => $producto->stock_actual,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
                DB::table('producto_bodega')->insert($filas);
            });

        foreach ($bodegaPrincipalPorEmpresa as $empresaId => $bodegaId) {
            DB::table('movimientos')->where('empresa_id', $empresaId)->update(['bodega_id' => $bodegaId]);
        }

        $totalProductosDespues = DB::table('productos')->count();
        $sumaStockDespues = (float) DB::table('productos')->sum('stock_actual');
        $totalMovimientosDespues = DB::table('movimientos')->count();
        $totalProductoBodega = DB::table('producto_bodega')->count();
        $sumaStockProductoBodega = (float) DB::table('producto_bodega')->sum('stock_actual');
        $movimientosSinBodega = DB::table('movimientos')->whereNull('bodega_id')->count();
        $totalBodegas = DB::table('bodegas')->count();

        throw_unless(
            $totalProductosAntes === $totalProductosDespues
            && abs($sumaStockAntes - $sumaStockDespues) < 0.001
            && $totalMovimientosAntes === $totalMovimientosDespues
            && $totalProductoBodega === $totalProductosDespues
            && abs($sumaStockProductoBodega - $sumaStockAntes) < 0.001
            && $movimientosSinBodega === 0
            && $totalBodegas === $empresas->count(),
            new RuntimeException(sprintf(
                'Validacion de backfill de bodegas fallo — abortando (rollback automatico). productos antes/despues=%d/%d, suma_stock antes/despues=%.2f/%.2f, movimientos antes/despues=%d/%d, producto_bodega filas=%d suma=%.2f, movimientos_sin_bodega=%d, bodegas=%d (esperado %d)',
                $totalProductosAntes, $totalProductosDespues,
                $sumaStockAntes, $sumaStockDespues,
                $totalMovimientosAntes, $totalMovimientosDespues,
                $totalProductoBodega, $sumaStockProductoBodega,
                $movimientosSinBodega,
                $totalBodegas, $empresas->count(),
            ))
        );
    }

    public function down(): void
    {
        Schema::table('movimientos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bodega_id');
        });

        Schema::dropIfExists('producto_bodega');
        Schema::dropIfExists('bodegas');
    }
};
