<?php

namespace Database\Seeders;

use App\Models\Cliente;
use App\Models\Empresa;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;

/**
 * Demo Data — módulo Clientes (2026-08-02).
 */
class ClienteSeeder extends Seeder
{
    public function crear(Empresa $empresa, int $cantidad): Collection
    {
        return Cliente::factory()
            ->count($cantidad)
            ->create(['empresa_id' => $empresa->id]);
    }
}
