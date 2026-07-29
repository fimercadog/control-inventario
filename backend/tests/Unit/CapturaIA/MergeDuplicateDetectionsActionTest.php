<?php

namespace Tests\Unit\CapturaIA;

use App\Actions\CapturaIA\MergeDuplicateDetectionsAction;
use App\DTO\AI\DetectedProductDTO;
use PHPUnit\Framework\TestCase;

class MergeDuplicateDetectionsActionTest extends TestCase
{
    public function test_sums_quantity_for_identical_products_instead_of_duplicating_rows(): void
    {
        // Ejemplo del brief: 15 Coca Cola 350ml no deben crear 15 registros,
        // sino 1 producto con cantidad = 15.
        $accion = new MergeDuplicateDetectionsAction();

        $detecciones = array_fill(0, 15, new DetectedProductDTO(
            name: 'Coca Cola',
            brand: 'Coca-Cola',
            presentation: '350ml',
            category: 'Bebida',
            quantity: 1,
            unit: 'Lata',
            confidence: 0.9,
        ));

        $resultado = $accion($detecciones);

        $this->assertCount(1, $resultado);
        $this->assertSame(15.0, $resultado[0]->quantity);
    }

    public function test_keeps_different_products_as_separate_entries(): void
    {
        $accion = new MergeDuplicateDetectionsAction();

        $detecciones = [
            new DetectedProductDTO('Coca Cola', 'Coca-Cola', '350ml', 'Bebida', 5, 'Lata', 0.95),
            new DetectedProductDTO('Pepsi', 'PepsiCo', '350ml', 'Bebida', 8, 'Lata', 0.92),
            new DetectedProductDTO('Sprite', 'Coca-Cola', '350ml', 'Bebida', 3, 'Lata', 0.88),
        ];

        $resultado = $accion($detecciones);

        $this->assertCount(3, $resultado);
    }

    public function test_averages_confidence_of_merged_duplicates(): void
    {
        $accion = new MergeDuplicateDetectionsAction();

        $detecciones = [
            new DetectedProductDTO('Dog Chow', 'Purina', '20kg', 'Alimento', 3, 'Bolsa', 1.0),
            new DetectedProductDTO('Dog Chow', 'Purina', '20kg', 'Alimento', 2, 'Bolsa', 0.6),
        ];

        $resultado = $accion($detecciones);

        $this->assertCount(1, $resultado);
        $this->assertSame(5.0, $resultado[0]->quantity);
        $this->assertSame(0.8, $resultado[0]->confidence);
    }

    public function test_matching_is_case_insensitive_and_trims_whitespace(): void
    {
        $accion = new MergeDuplicateDetectionsAction();

        $detecciones = [
            new DetectedProductDTO('Dog Chow', 'Purina', '20kg', 'Alimento', 3, 'Bolsa', 0.9),
            new DetectedProductDTO(' dog chow ', ' purina ', ' 20kg ', 'Alimento', 2, 'Bolsa', 0.9),
        ];

        $resultado = $accion($detecciones);

        $this->assertCount(1, $resultado);
        $this->assertSame(5.0, $resultado[0]->quantity);
    }
}
