<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Replace E2E labels while retaining existing product-brand relationships. */
    public function up(): void
    {
        $brandNames = [
            'Pata Feliz',
            'Huella Natural',
            'Mundo Animal',
            'PetVida',
            'Amigo Peludo',
            'Canino Selecto',
            'Felino Urbano',
            'Vital Mascota',
            'BioPet',
            'Club Animal',
        ];

        $brands = DB::table('marcas')
            ->select('id')
            ->where('nombre', 'like', 'E2E%')
            ->orderBy('id')
            ->get();

        foreach ($brands as $index => $brand) {
            $name = $brandNames[$index % count($brandNames)];

            DB::table('marcas')
                ->where('id', $brand->id)
                ->update(['nombre' => sprintf('%s - línea demo %02d', $name, intdiv($index, count($brandNames)) + 1)]);
        }
    }

    public function down(): void
    {
        // Original values were volatile E2E test labels and are intentionally not restored.
    }
};
