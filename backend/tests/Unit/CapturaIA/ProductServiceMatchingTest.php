<?php

namespace Tests\Unit\CapturaIA;

use App\Models\Empresa;
use App\Models\Marca;
use App\Models\Producto;
use App\Repositories\ProductRepository;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * El matching de identidad de producto es una regla de Productos, no de
 * Captura IA (sección 74 del master spec, punto 1) — por eso vive y se
 * prueba en ProductService, no en un Action bajo Actions/CapturaIA.
 */
class ProductServiceMatchingTest extends TestCase
{
    use RefreshDatabase;

    public function test_finds_existing_product_by_name_brand_and_presentation(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $marca = Marca::create(['empresa_id' => $empresa->id, 'nombre' => 'Purina']);

        $producto = Producto::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Dog Chow Adultos',
            'marca_id' => $marca->id,
            'presentacion' => '20 kg',
        ]);

        $servicio = new ProductService(new ProductRepository());

        $encontrado = $servicio->buscarCoincidencia($empresa->id, 'Dog Chow Adultos', 'Purina', '20 kg');

        $this->assertNotNull($encontrado);
        $this->assertSame($producto->id, $encontrado->id);
    }

    public function test_returns_null_when_no_product_matches(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $servicio = new ProductService(new ProductRepository());

        $this->assertNull($servicio->buscarCoincidencia($empresa->id, 'Producto Nuevo', 'Marca X', '1 kg'));
    }

    public function test_does_not_match_products_from_a_different_empresa(): void
    {
        $empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $empresaB = Empresa::create(['nombre' => 'Empresa B']);

        $marcaA = Marca::create(['empresa_id' => $empresaA->id, 'nombre' => 'Purina']);
        Producto::create([
            'empresa_id' => $empresaA->id,
            'nombre' => 'Dog Chow Adultos',
            'marca_id' => $marcaA->id,
            'presentacion' => '20 kg',
        ]);

        $servicio = new ProductService(new ProductRepository());

        $this->assertNull($servicio->buscarCoincidencia($empresaB->id, 'Dog Chow Adultos', 'Purina', '20 kg'));
    }
}
