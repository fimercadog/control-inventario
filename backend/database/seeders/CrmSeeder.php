<?php

namespace Database\Seeders;

use App\Models\Actividad;
use App\Models\Automatizacion;
use App\Models\Cliente;
use App\Models\Contacto;
use App\Models\Empresa;
use App\Models\EtapaOportunidad;
use App\Models\Oportunidad;
use App\Models\User;

class CrmSeeder
{
    public function crear(Empresa $empresa): void
    {
        $stages = collect([
            ['nombre' => 'Nuevo', 'orden' => 1, 'probabilidad' => 10, 'tipo' => 'abierta'],
            ['nombre' => 'Calificación', 'orden' => 2, 'probabilidad' => 25, 'tipo' => 'abierta'],
            ['nombre' => 'Propuesta', 'orden' => 3, 'probabilidad' => 60, 'tipo' => 'abierta'],
            ['nombre' => 'Negociación', 'orden' => 4, 'probabilidad' => 80, 'tipo' => 'abierta'],
            ['nombre' => 'Ganada', 'orden' => 5, 'probabilidad' => 100, 'tipo' => 'ganada'],
            ['nombre' => 'Perdida', 'orden' => 6, 'probabilidad' => 0, 'tipo' => 'perdida'],
        ])->map(fn (array $stage) => EtapaOportunidad::firstOrCreate(['empresa_id' => $empresa->id, 'nombre' => $stage['nombre']], [...$stage, 'empresa_id' => $empresa->id]));

        Automatizacion::firstOrCreate(
            ['empresa_id' => $empresa->id, 'nombre' => 'Seguimiento al crear oportunidad'],
            ['evento' => 'oportunidad.creada', 'acciones' => [['tipo' => 'crear_actividad', 'asunto' => 'Primer seguimiento comercial', 'dias' => 1], ['tipo' => 'notificar', 'titulo' => 'Nueva oportunidad']], 'activa' => true],
        );

        $responsable = User::where('empresa_id', $empresa->id)->first();
        $clientes = Cliente::where('empresa_id', $empresa->id)->take(5)->get();
        foreach ($clientes as $index => $cliente) {
            $contacto = Contacto::firstOrCreate(
                ['empresa_id' => $empresa->id, 'email' => "contacto{$cliente->id}@empresa-demo.test"],
                ['cliente_id' => $cliente->id, 'responsable_id' => $responsable?->id, 'nombre' => 'Contacto', 'apellido' => "{$index}", 'telefono' => '300 000 0000', 'cargo' => 'Compras', 'origen' => 'Referido', 'estado' => 'cliente'],
            );
            $etapa = $stages[$index % 4];
            $oportunidad = Oportunidad::firstOrCreate(
                ['empresa_id' => $empresa->id, 'nombre' => "Renovación {$cliente->nombre}"],
                ['cliente_id' => $cliente->id, 'contacto_id' => $contacto->id, 'etapa_oportunidad_id' => $etapa->id, 'responsable_id' => $responsable?->id, 'monto' => 150000 + ($index * 50000), 'probabilidad' => $etapa->probabilidad, 'fecha_cierre_estimada' => now()->addDays(7 + ($index * 5))->toDateString()],
            );
            Actividad::firstOrCreate(
                ['empresa_id' => $empresa->id, 'oportunidad_id' => $oportunidad->id, 'asunto' => 'Contactar para seguimiento'],
                ['cliente_id' => $cliente->id, 'responsable_id' => $responsable?->id, 'creado_por_id' => $responsable?->id, 'tipo' => 'llamada', 'estado' => 'pendiente', 'programada_para' => now()->addDays($index + 1)],
            );
        }
    }
}
