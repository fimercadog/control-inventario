<?php

namespace Database\Factories;

use App\Models\UnidadMedida;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UnidadMedida>
 */
class UnidadMedidaFactory extends Factory
{
    protected $model = UnidadMedida::class;

    /** `nombre`/`abreviatura` normalmente se pasan explícitos desde el seeder (lista curada). */
    public function definition(): array
    {
        return [
            'nombre' => fake()->word(),
            'abreviatura' => fake()->lexify('??'),
            'estado' => 'activo',
        ];
    }
}
