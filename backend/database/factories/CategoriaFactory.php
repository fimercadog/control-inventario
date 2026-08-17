<?php

namespace Database\Factories;

use App\Models\Categoria;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Categoria>
 */
class CategoriaFactory extends Factory
{
    protected $model = Categoria::class;

    /**
     * `nombre` se pasa explícito desde el seeder (lista curada de 20
     * categorías reales de una tienda de mascotas) para poder garantizar
     * nombres distintos por empresa sin depender de `fake()->unique()`,
     * que no se puede resetear entre empresas dentro del mismo proceso.
     */
    public function definition(): array
    {
        return [
            'nombre' => fake()->words(2, true),
            'descripcion' => fake()->optional(0.6)->sentence(),
            'estado' => 'activo',
        ];
    }
}
