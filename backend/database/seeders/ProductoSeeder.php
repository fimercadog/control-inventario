<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Marca;
use App\Models\Producto;
use App\Models\UnidadMedida;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Demo Data RC1. Cada producto queda asociado a una categoría/marca/unidad
 * de medida REALES ya existentes de la misma empresa — nunca un id
 * inventado — para que la integridad referencial sea válida desde el
 * origen. `stock_actual` nace en 0 (default de columna); MovimientoSeeder
 * lo sube después vía InventoryService, nunca aquí directamente.
 */
class ProductoSeeder extends Seeder
{
    public function crear(Empresa $empresa, int $cantidad): Collection
    {
        $categoriaIds = Categoria::where('empresa_id', $empresa->id)->pluck('id')->all();
        $marcaIds = Marca::where('empresa_id', $empresa->id)->pluck('id')->all();
        $unidadIds = UnidadMedida::where('empresa_id', $empresa->id)->pluck('id')->all();

        return Producto::factory()
            ->count($cantidad)
            ->sequence(fn () => [
                'empresa_id' => $empresa->id,
                'categoria_id' => fake()->optional(0.9)->randomElement($categoriaIds),
                'marca_id' => fake()->optional(0.85)->randomElement($marcaIds),
                'unidad_medida_id' => fake()->optional(0.9)->randomElement($unidadIds),
            ])
            ->create();
    }
}
