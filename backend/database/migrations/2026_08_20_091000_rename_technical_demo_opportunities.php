<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Keep generated CRM opportunity labels aligned with the cleaned demo clients. */
    public function up(): void
    {
        $opportunities = DB::table('oportunidades as oportunidad')
            ->join('clientes as cliente', 'cliente.id', '=', 'oportunidad.cliente_id')
            ->select('oportunidad.id', 'cliente.nombre as cliente_nombre')
            ->where('oportunidad.nombre', 'like', '%QA Cliente Modal%')
            ->orWhere('oportunidad.nombre', 'like', '%E2E%Cliente%')
            ->get();

        foreach ($opportunities as $opportunity) {
            DB::table('oportunidades')
                ->where('id', $opportunity->id)
                ->update(['nombre' => "Renovación {$opportunity->cliente_nombre}"]);
        }
    }

    public function down(): void
    {
        // Original names came from volatile E2E test data and are not restored.
    }
};
