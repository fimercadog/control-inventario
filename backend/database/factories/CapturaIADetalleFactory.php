<?php

namespace Database\Factories;

use App\Enums\CapturaIA\EstadoCapturaDetalle;
use App\Models\CapturaIADetalle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CapturaIADetalle>
 */
class CapturaIADetalleFactory extends Factory
{
    protected $model = CapturaIADetalle::class;

    public function definition(): array
    {
        return [
            'nombre_detectado' => fake()->randomElement([
                'Dog Chow Adultos', 'Royal Canin Mini', 'Whiskas Pescado', 'Pedigree Cachorro',
                'Purina Pro Plan', 'Cat Chow Gatos', 'Amoxicilina 500mg', 'Shampoo Antipulgas',
            ]),
            'marca_detectado' => fake()->optional(0.8)->randomElement(['Purina', 'Royal Canin', 'Mars', 'Nestlé']),
            'categoria_detectado' => fake()->optional(0.7)->randomElement(['Alimento', 'Medicamento', 'Higiene']),
            'presentacion_detectado' => fake()->optional(0.8)->randomElement(['1 kg', '3 kg', '20 kg', 'Caja']),
            'unidad_detectado' => fake()->optional(0.6)->randomElement(['Bolsa', 'Caja', 'Unidad']),
            'cantidad_detectada' => fake()->randomFloat(2, 1, 30),
            'confianza' => fake()->randomFloat(3, 0.5, 0.99),
            'es_producto_nuevo' => fake()->boolean(30),
            'estado' => fake()->randomElement(EstadoCapturaDetalle::cases()),
        ];
    }
}
