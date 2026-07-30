<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Marca;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Demo Data RC1. Lista curada de marcas reales del rubro de mascotas.
 */
class MarcaSeeder extends Seeder
{
    private const NOMBRES = [
        'Purina', 'Royal Canin', 'Pedigree', 'Whiskas', 'Cat Chow', 'Dog Chow',
        'Hills Science Diet', 'Eukanuba', 'Iams', 'Nutrivet', 'Ringo', 'Excellent',
        'ProPlan', 'Nupec', 'Champion Petfoods', 'Orijen', 'Acana', 'Nutro',
        'Bravecto', 'Frontline', 'Advantix', 'Vetoquinol', 'Virbac', 'Petland',
        'Kong', 'Trixie', 'Ferplast', 'Imperial Cat', 'Catit', 'Zolia',
    ];

    public function crear(Empresa $empresa, int $cantidad): Collection
    {
        $nombres = array_slice(self::NOMBRES, 0, min($cantidad, count(self::NOMBRES)));

        return collect($nombres)->map(
            fn (string $nombre) => Marca::factory()->create([
                'empresa_id' => $empresa->id,
                'nombre' => $nombre,
            ])
        );
    }
}
