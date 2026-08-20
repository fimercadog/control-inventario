<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Replace QA/E2E supplier labels without changing supplier relationships. */
    public function up(): void
    {
        $supplierNames = [
            'Distribuciones VetCare S.A.S.',
            'Suministros Mascota S.A.S.',
            'Importadora Animalia S.A.S.',
            'Comercializadora PetMarket S.A.S.',
            'Abastecimientos del Valle S.A.S.',
            'Aliados Veterinarios S.A.S.',
            'Proveedora Animal Andina S.A.S.',
            'Soluciones Pet Supply S.A.S.',
        ];

        $suppliers = DB::table('proveedores')
            ->select('id')
            ->where(function ($query): void {
                $query->where('nombre', 'like', 'E2E%')
                    ->orWhere('nombre', 'like', 'QA%');
            })
            ->orderBy('id')
            ->get();

        foreach ($suppliers as $index => $supplier) {
            $name = $supplierNames[$index % count($supplierNames)];

            DB::table('proveedores')
                ->where('id', $supplier->id)
                ->update(['nombre' => sprintf('%s - línea demo %02d', $name, intdiv($index, count($supplierNames)) + 1)]);
        }
    }

    public function down(): void
    {
        // Original values were volatile test labels and are intentionally not restored.
    }
};
