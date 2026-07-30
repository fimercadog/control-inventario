<?php

namespace Database\Factories;

use App\Enums\CapturaIA\EstadoCaptura;
use App\Enums\CapturaIA\TipoCaptura;
use App\Models\CapturaIA;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CapturaIA>
 */
class CapturaIAFactory extends Factory
{
    protected $model = CapturaIA::class;

    /**
     * `uuid` normalmente lo asigna el hook `creating` del modelo — pero
     * DatabaseSeeder usa WithoutModelEvents (ningún evento Eloquent dispara
     * durante el seeding), así que se fija explícito aquí.
     */
    public function definition(): array
    {
        $tipo = fake()->randomElement(TipoCaptura::cases());

        return [
            'uuid' => (string) Str::uuid(),
            'tipo' => $tipo,
            'archivo_path' => $tipo !== TipoCaptura::Voz ? 'capturas/demo/'.fake()->uuid().'.jpg' : null,
            'archivo_secundario_path' => $tipo === TipoCaptura::FotoVoz ? 'capturas/demo/'.fake()->uuid().'.webm' : null,
            'archivo_mime' => match ($tipo) {
                TipoCaptura::Voz => 'audio/webm',
                default => 'image/jpeg',
            },
            'transcripcion' => $tipo !== TipoCaptura::Foto ? fake()->sentence(12) : null,
            'proveedor_ia' => 'openai',
            'tiempo_procesamiento_ms' => fake()->numberBetween(800, 4500),
            'movimiento_tipo' => fake()->randomElement(['entrada', 'salida']),
            'confianza_promedio' => fake()->randomFloat(3, 0.55, 0.99),
            // Excluye 'procesando': el pipeline síncrono real nunca deja una
            // captura en ese estado (ver comentario en CapturaIA::class), no
            // tendría sentido en datos demo que simulan historial ya resuelto.
            'estado' => fake()->randomElement([
                EstadoCaptura::Aplicado, EstadoCaptura::Aplicado, EstadoCaptura::Aplicado,
                EstadoCaptura::PendienteRevision, EstadoCaptura::Parcial, EstadoCaptura::Descartado,
            ]),
        ];
    }
}
