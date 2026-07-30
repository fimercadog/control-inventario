<?php

namespace Database\Factories;

use App\Models\Proveedor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Proveedor>
 */
class ProveedorFactory extends Factory
{
    protected $model = Proveedor::class;

    public function definition(): array
    {
        return [
            'nombre' => fake()->company(),
            'nit' => fake()->unique()->numerify('9########-#'),
            'contacto' => fake()->name(),
            'telefono' => fake()->numerify('3##########'),
            'email' => fake()->unique()->companyEmail(),
            'direccion' => fake()->streetAddress(),
            'ciudad' => fake()->city(),
            'pais' => 'Colombia',
            'notas' => fake()->optional(0.3)->sentence(),
            'estado' => 'activo',
        ];
    }
}
