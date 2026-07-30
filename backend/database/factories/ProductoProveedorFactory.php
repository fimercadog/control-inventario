<?php

namespace Database\Factories;

use App\Models\ProductoProveedor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductoProveedor>
 *
 * `producto_id`/`proveedor_id` siempre se pasan explícitos desde el
 * seeder — la tabla tiene un unique(producto_id, proveedor_id), así que
 * el seeder es quien controla qué pares ya existen.
 */
class ProductoProveedorFactory extends Factory
{
    protected $model = ProductoProveedor::class;

    public function definition(): array
    {
        return [
            'es_principal' => false,
            'precio_compra' => fake()->randomFloat(2, 5, 250),
            'codigo_proveedor' => fake()->optional(0.7)->bothify('PROV-???-####'),
            'estado' => 'activo',
        ];
    }
}
