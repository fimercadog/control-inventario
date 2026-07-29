<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(PermissionSeeder::class);

        // Empresa demo para el frontend (Fase 4): Captura IA exige un
        // empresa_id real (no hay endpoint de Empresas todavía — módulo
        // fuera de alcance). El frontend referencia este registro por id.
        $empresa = Empresa::firstOrCreate(['nombre' => 'Fidel OS Demo']);

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'empresa_id' => $empresa->id,
        ]);
    }
}
