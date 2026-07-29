<?php

namespace Tests\Unit\CapturaIA;

use App\DTO\AI\StructuredExtractionDTO;
use PHPUnit\Framework\TestCase;

class StructuredExtractionDTOTest extends TestCase
{
    public function test_products_is_always_an_array_even_with_one_element(): void
    {
        $resultado = StructuredExtractionDTO::fromArray([
            'products' => [
                [
                    'name' => 'Dog Chow Adultos',
                    'brand' => 'Purina',
                    'presentation' => '20 kg',
                    'category' => 'Alimento',
                    'quantity' => 5,
                    'unit' => 'Bolsa',
                    'confidence' => 0.96,
                ],
            ],
            'movement' => 'entrada',
        ]);

        $this->assertIsArray($resultado->products);
        $this->assertCount(1, $resultado->products);
        $this->assertSame('Dog Chow Adultos', $resultado->products[0]->name);
        $this->assertSame('entrada', $resultado->movement);
    }

    public function test_a_stray_object_from_the_provider_is_wrapped_into_a_one_element_array(): void
    {
        // Si el proveedor de IA devolviera un objeto suelto en vez de un
        // arreglo (incumpliendo el contrato), el DTO debe normalizarlo en
        // vez de perder el dato o fallar (sección 74 del master spec).
        $resultado = StructuredExtractionDTO::fromArray([
            'products' => [
                'name' => 'Royal Canin Mini',
                'brand' => null,
                'presentation' => null,
                'category' => null,
                'quantity' => 1,
                'unit' => null,
                'confidence' => 0.4,
            ],
            'movement' => 'entrada',
        ]);

        $this->assertCount(1, $resultado->products);
        $this->assertSame('Royal Canin Mini', $resultado->products[0]->name);
    }

    public function test_missing_products_key_defaults_to_empty_array(): void
    {
        $resultado = StructuredExtractionDTO::fromArray(['movement' => 'entrada']);

        $this->assertSame([], $resultado->products);
    }

    public function test_to_array_round_trips_the_contract(): void
    {
        $original = [
            'products' => [
                [
                    'name' => 'Amoxicilina',
                    'brand' => null,
                    'presentation' => '500 mg',
                    'category' => 'Medicamento',
                    'quantity' => 4.0,
                    'unit' => 'Caja',
                    'confidence' => 0.9,
                ],
            ],
            'movement' => 'entrada',
        ];

        $resultado = StructuredExtractionDTO::fromArray($original);

        $this->assertSame($original, $resultado->toArray());
    }
}
