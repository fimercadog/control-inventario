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
    public function crear(Empresa $empresa, int $cantidad): Collection
    {
        return Proveedor::factory()
            ->count($cantidad)
            ->create(['empresa_id' => $empresa->id]);
    }
}
