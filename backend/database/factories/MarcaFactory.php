<?php

namespace Database\Factories;

use App\Models\Marca;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Marca>
 */
class MarcaFactory extends Factory
{
    protected $model = Marca::class;

    /** `nombre` normalmente se pasa explícito desde el seeder (lista curada). */
    public function definition(): array
    {
        return [
            'nombre' => fake()->company(),
            'estado' => 'activo',
        ];
    }
}
