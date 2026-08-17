<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Empresa;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Demo Data RC1. Lista curada de categorías reales de una tienda de
 * mascotas — nombres distintos garantizados por empresa sin depender de
 * `fake()->unique()` (que no se puede resetear entre empresas).
 */
class CategoriaSeeder extends Seeder
{
    private const NOMBRES = [
        'Alimento para perros', 'Alimento para gatos', 'Snacks y premios',
        'Higiene y cuidado', 'Accesorios', 'Juguetes', 'Farmacia veterinaria',
        'Camas y transportadoras', 'Correas y collares', 'Peceras y acuarios',
        'Aves y roedores', 'Antipulgas y garrapatas', 'Shampoos y cepillos',
        'Comederos y bebederos', 'Suplementos nutricionales', 'Ropa para mascotas',
        'Arena sanitaria', 'Vitaminas', 'Adiestramiento', 'Ambientadores',
    ];

    public function crear(Empresa $empresa, int $cantidad): Collection
    {
        $nombres = array_slice(self::NOMBRES, 0, min($cantidad, count(self::NOMBRES)));

        return collect($nombres)->map(
            fn (string $nombre) => Categoria::factory()->create([
                'empresa_id' => $empresa->id,
                'nombre' => $nombre,
            ])
        );
    }
}
