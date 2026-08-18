<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\UnidadMedida;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Demo Data RC1. Lista curada de unidades de medida reales.
 */
class UnidadMedidaSeeder extends Seeder
{
    private const UNIDADES = [
        ['nombre' => 'Unidad', 'abreviatura' => 'u'],
        ['nombre' => 'Caja', 'abreviatura' => 'caja'],
        ['nombre' => 'Bolsa', 'abreviatura' => 'bolsa'],
        ['nombre' => 'Kilogramo', 'abreviatura' => 'kg'],
        ['nombre' => 'Gramo', 'abreviatura' => 'g'],
        ['nombre' => 'Litro', 'abreviatura' => 'L'],
        ['nombre' => 'Mililitro', 'abreviatura' => 'ml'],
        ['nombre' => 'Paquete', 'abreviatura' => 'paq'],
        ['nombre' => 'Docena', 'abreviatura' => 'doc'],
        ['nombre' => 'Par', 'abreviatura' => 'par'],
        ['nombre' => 'Botella', 'abreviatura' => 'bot'],
    ];

    public function crear(Empresa $empresa, int $cantidad): Collection
    {
        $unidades = array_slice(self::UNIDADES, 0, min($cantidad, count(self::UNIDADES)));

        return collect($unidades)->map(
            fn (array $unidad) => UnidadMedida::factory()->create([
                'empresa_id' => $empresa->id,
                'nombre' => $unidad['nombre'],
                'abreviatura' => $unidad['abreviatura'],
            ])
        );
    }
}
