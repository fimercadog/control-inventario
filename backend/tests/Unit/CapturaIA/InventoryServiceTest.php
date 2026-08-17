<?php

namespace Tests\Unit\CapturaIA;

use App\Enums\TipoMovimiento;
use App\Exceptions\StockInsuficienteException;
use App\Models\Empresa;
use App\Models\Producto;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryServiceTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create(['nombre' => 'Fidel OS']);
    }

    private function crearProducto(): Producto
    {
        return Producto::create(['nombre' => 'Dog Chow Adultos', 'empresa_id' => $this->empresa->id]);
    }

    public function test_registrar_movimiento_increments_stock_and_records_before_after(): void
    {
        $producto = $this->crearProducto();
        $servicio = new InventoryService();

        $movimiento = $servicio->registrarMovimiento($producto, TipoMovimiento::Entrada, 5.0);

        $this->assertSame(0.0, (float) $movimiento->stock_anterior);
        $this->assertSame(5.0, (float) $movimiento->stock_nuevo);
        $this->assertSame(5.0, (float) $producto->fresh()->stock_actual);
    }

    public function test_salida_decrements_stock_from_a_positive_quantity(): void
    {
        // El llamador nunca pasa el signo: InventoryService decide la
        // dirección según TipoMovimiento (sección 74 del master spec,
        // punto 1 — esa regla no puede vivir fuera de Inventario).
        $producto = $this->crearProducto();

        $servicio = new InventoryService();
        $servicio->registrarMovimiento($producto, TipoMovimiento::Entrada, 10.0);
        $movimiento = $servicio->registrarMovimiento($producto->fresh(), TipoMovimiento::Salida, 4.0);

        $this->assertSame(10.0, (float) $movimiento->stock_anterior);
        $this->assertSame(6.0, (float) $movimiento->stock_nuevo);
        $this->assertSame(4.0, (float) $movimiento->cantidad);
        $this->assertSame(6.0, (float) $producto->fresh()->stock_actual);
    }

    public function test_a_negative_quantity_is_treated_as_its_magnitude(): void
    {
        // La magnitud manda, no el signo que el llamador haya pasado por error.
        $producto = $this->crearProducto();

        $servicio = new InventoryService();
        $movimiento = $servicio->registrarMovimiento($producto, TipoMovimiento::Entrada, -5.0);

        $this->assertSame(5.0, (float) $movimiento->cantidad);
        $this->assertSame(5.0, (float) $producto->fresh()->stock_actual);
    }

    public function test_throws_when_resulting_stock_would_be_negative(): void
    {
        $producto = $this->crearProducto();
        $servicio = new InventoryService();

        $this->expectException(StockInsuficienteException::class);

        $servicio->registrarMovimiento($producto, TipoMovimiento::Salida, 1.0);
    }
}
