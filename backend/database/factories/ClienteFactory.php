<?php

namespace Database\Factories;

use App\Models\Cliente;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Cliente>
 */
class ClienteFactory extends Factory
{
    protected $model = Cliente::class;

    public function definition(): array
    {
        return [
            'nombre' => fake()->boolean(70) ? fake()->company() : fake()->name(),
            'nit' => fake()->unique()->numerify('9########-#'),
            'contacto' => fake()->name(),
            'telefono' => fake()->numerify('3##########'),
            'email' => fake()->unique()->safeEmail(),
            'direccion' => fake()->streetAddress(),
            'ciudad' => fake()->city(),
            'pais' => 'Colombia',
            'notas' => fake()->optional(0.3)->sentence(),
            'estado' => 'activo',
        ];
    }
}
