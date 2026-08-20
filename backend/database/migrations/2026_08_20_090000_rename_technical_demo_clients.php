<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Replace E2E/test labels left in the demo database without touching the
     * client IDs, contacts, opportunities, or any other relationships.
     */
    public function up(): void
    {
        $prefixes = [
            'Comercializadora Andina S.A.S.',
            'Distribuciones Horizonte S.A.S.',
            'Grupo Empresarial del Norte S.A.S.',
            'Soluciones Comerciales del Caribe S.A.S.',
            'Inversiones La Sabana S.A.S.',
            'Mercados del Centro S.A.S.',
            'Servicios Integrales del Valle S.A.S.',
            'Alianza Comercial Cafetera S.A.S.',
        ];

        $clients = DB::table('clientes')
            ->select('id')
            ->where('nombre', 'like', 'QA Cliente Modal%')
            ->orWhere('nombre', 'like', 'E2E%Cliente%')
            ->orderBy('id')
            ->get();

        foreach ($clients as $index => $client) {
            $name = $prefixes[$index % count($prefixes)];

            DB::table('clientes')
                ->where('id', $client->id)
                ->update(['nombre' => sprintf('%s %02d', $name, intdiv($index, count($prefixes)) + 1)]);
        }
    }

    public function down(): void
    {
        // The original labels were volatile test artifacts and are intentionally not restored.
    }
};
