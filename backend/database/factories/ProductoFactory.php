<?php

namespace Database\Factories;

use App\Models\Producto;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Producto>
 *
 * `stock_actual` nunca se define aquí — nace en 0 (default de columna) y
 * sube únicamente vía movimientos reales generados por MovimientoSeeder a
 * través de InventoryService, igual que en producción (docs/00_MASTER_SPECIFICATION.md
 * sección 74, "Propiedad exclusiva del stock").
 */
class ProductoFactory extends Factory
{
    protected $model = Producto::class;

    public function definition(): array
    {
        $nombreBase = fake()->randomElement([
            'Alimento seco', 'Alimento húmedo', 'Snack dental', 'Shampoo', 'Correa',
            'Collar', 'Cama', 'Transportadora', 'Arena sanitaria', 'Juguete de cuerda',
            'Pelota', 'Rascador', 'Comedero', 'Bebedero automático', 'Vitamina',
            'Antipulgas', 'Suplemento articular', 'Ropa de invierno', 'Peine', 'Cepillo dental',
        ]);
        $presentacion = fake()->randomElement(['1 kg', '2 kg', '3 kg', '7.5 kg', '15 kg', '20 kg', 'Unidad', 'Paquete x 3', '500 ml', '1 L']);

        return [
            'codigo' => fake()->unique()->bothify('SKU-####??'),
            'codigo_barras' => fake()->unique()->ean13(),
            'nombre' => "{$nombreBase} {$presentacion}",
            'descripcion' => fake()->optional(0.5)->sentence(),
            'presentacion' => $presentacion,
            'costo' => fake()->randomFloat(2, 5, 300),
            'precio' => fake()->randomFloat(2, 10, 450),
            'stock_minimo' => fake()->numberBetween(5, 30),
            'stock_maximo' => fake()->numberBetween(100, 500),
            'imagen' => null,
            'estado' => 'activo',
        ];
    }
}
