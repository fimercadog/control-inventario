<?php

namespace Database\Seeders;

use App\Models\CapturaIA;
use App\Models\CapturaIADetalle;
use App\Models\Empresa;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Demo Data RC1. Genera capturas ya resueltas (no llama al pipeline real de
 * OpenAI — costaría dinero real y dependería de red para simple volumen de
 * demostración). Cada captura tiene 1-3 detalles, mismo shape que el
 * pipeline real produce.
 */
class CapturaIASeeder extends Seeder
{
    public function crear(Empresa $empresa, int $cantidad): int
    {
        $usuarioIds = DB::table('users')->where('empresa_id', $empresa->id)->pluck('id')->all();

        for ($i = 0; $i < $cantidad; $i++) {
            $captura = CapturaIA::factory()->create([
                'empresa_id' => $empresa->id,
                'usuario_id' => $usuarioIds === [] ? null : fake()->randomElement($usuarioIds),
            ]);

            CapturaIADetalle::factory()
                ->count(fake()->numberBetween(1, 3))
                ->create(['captura_id' => $captura->id]);
        }

        return $cantidad;
    }
}
