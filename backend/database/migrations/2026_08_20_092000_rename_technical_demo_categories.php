<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Replace technical E2E labels while retaining product-category relationships. */
    public function up(): void
    {
        $categoryNames = [
            'Alimentos y suplementos',
            'Higiene y cuidado',
            'Juguetes y entretenimiento',
            'Accesorios para mascotas',
            'Correas y paseos',
            'Farmacia veterinaria',
            'Descanso y confort',
            'Ropa y temporada',
            'Aves y roedores',
            'Acuarios y peces',
            'Snacks y premios',
            'Entrenamiento y conducta',
        ];

        $categories = DB::table('categorias')
            ->select('id')
            ->where('nombre', 'like', 'E2E%')
            ->orderBy('id')
            ->get();

        foreach ($categories as $index => $category) {
            $name = $categoryNames[$index % count($categoryNames)];

            DB::table('categorias')
                ->where('id', $category->id)
                ->update(['nombre' => sprintf('%s - colección demo %02d', $name, intdiv($index, count($categoryNames)) + 1)]);
        }
    }

    public function down(): void
    {
        // Original values were volatile E2E test labels and are intentionally not restored.
    }
};
