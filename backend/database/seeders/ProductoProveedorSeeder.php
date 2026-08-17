<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\ProductoProveedor;
use App\Models\Producto;
use App\Models\Proveedor;
use Illuminate\Database\Seeder;

/**
 * Demo Data RC1. Asocia entre 1 y 4 proveedores por producto (promedio ~3,
 * para acercarse al volumen objetivo de ~1500 pares con 500 productos),
 * respetando el unique(producto_id, proveedor_id) y garantizando
 * exactamente un proveedor principal por producto asociado — misma regla
 * de negocio que ya aplica ProductoProveedorController en producción.
 */
class ProductoProveedorSeeder extends Seeder
{
    public function crear(Empresa $empresa): int
    {
        $productoIds = Producto::where('empresa_id', $empresa->id)->pluck('id')->all();
        $proveedorIds = Proveedor::where('empresa_id', $empresa->id)->pluck('id')->all();

        if ($productoIds === [] || $proveedorIds === []) {
            return 0;
        }

        $creados = 0;

        foreach ($productoIds as $productoId) {
            $cantidadProveedores = min(count($proveedorIds), fake()->numberBetween(1, 4));
            $proveedoresElegidos = (array) array_rand(array_flip($proveedorIds), $cantidadProveedores);

            foreach (array_values($proveedoresElegidos) as $indice => $proveedorId) {
                ProductoProveedor::factory()->create([
                    'empresa_id' => $empresa->id,
                    'producto_id' => $productoId,
                    'proveedor_id' => $proveedorId,
                    'es_principal' => $indice === 0,
                ]);
                $creados++;
            }
        }

        return $creados;
    }
}
