<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Proveedor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Demo Data RC1.
 */
class ProveedorSeeder extends Seeder
{
    private const NOMBRES_DEMO = [
        'Distribuidora Pet Colombia',
        'Veterinaria Andina',
        'Importadora Mascotas S.A.S.',
        'Comercializadora AnimalCare',
        'Pet Supply Bogotá',
        'Nutrición Animal Nacional',
        'Mundo Mascotas Mayorista',
    ];

    public function crear(Empresa $empresa, int $cantidad): Collection
    {
        $proveedores = Proveedor::factory()
            ->count($cantidad)
            ->create(['empresa_id' => $empresa->id]);

        $proveedores->take(count(self::NOMBRES_DEMO))->each(
            fn (Proveedor $proveedor, int $indice) => $proveedor->update(['nombre' => self::NOMBRES_DEMO[$indice]])
        );

        return $proveedores;
    }
}
