<?php

namespace Tests\Unit\CapturaIA;

use App\Actions\CapturaIA\ApplyInventoryMovementAction;
use App\DTO\AI\DetectedProductDTO;
use App\Enums\CapturaIA\EstadoCapturaDetalle;
use App\Enums\TipoMovimiento;
use App\Models\Empresa;
use App\Repositories\ProductRepository;
use App\Services\InventoryService;
use App\Services\ProductService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApplyInventoryMovementActionTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create(['nombre' => 'Fidel OS']);
    }

    public function test_high_confidence_creates_product_and_movement_automatically(): void
    {
        config(['captura_ia.confidence_threshold' => 0.85]);

        $accion = $this->accion();

        $detectado = new DetectedProductDTO('Dog Chow Adultos', 'Purina', '20 kg', 'Alimento', 5, 'Bolsa', 0.96);

        $resultado = $accion($this->empresa->id, $detectado, TipoMovimiento::Entrada);

        $this->assertSame(EstadoCapturaDetalle::Aplicado, $resultado->estado);
        $this->assertTrue($resultado->esProductoNuevo);
        $this->assertNotNull($resultado->producto);
        $this->assertNotNull($resultado->movimiento);
        $this->assertSame(5.0, (float) $resultado->producto->stock_actual);
    }

    public function test_low_confidence_is_sent_to_review_without_touching_stock(): void
    {
        config(['captura_ia.confidence_threshold' => 0.85]);

        $accion = $this->accion();

        $detectado = new DetectedProductDTO('Royal Canin Mini', null, null, null, 10, null, 0.4);

        $resultado = $accion($this->empresa->id, $detectado, TipoMovimiento::Entrada);

        $this->assertSame(EstadoCapturaDetalle::PendienteRevision, $resultado->estado);
        $this->assertNull($resultado->producto);
        $this->assertNull($resultado->movimiento);
        $this->assertDatabaseCount('productos', 0);
        $this->assertDatabaseCount('movimientos', 0);
    }

    public function test_confidence_exactly_at_threshold_applies(): void
    {
        config(['captura_ia.confidence_threshold' => 0.85]);

        $accion = $this->accion();

        $detectado = new DetectedProductDTO('Amoxicilina', null, '500 mg', 'Medicamento', 4, 'Caja', 0.85);

        $resultado = $accion($this->empresa->id, $detectado, TipoMovimiento::Entrada);

        $this->assertSame(EstadoCapturaDetalle::Aplicado, $resultado->estado);
    }

    public function test_existing_product_is_reused_instead_of_duplicated(): void
    {
        config(['captura_ia.confidence_threshold' => 0.85]);

        $productos = new ProductService(new ProductRepository());
        $productoExistente = $productos->crear([
            'empresa_id' => $this->empresa->id,
            'nombre' => 'Dog Chow Adultos',
            'marca' => 'Purina',
            'presentacion' => '20 kg',
        ]);

        $accion = new ApplyInventoryMovementAction($productos, new InventoryService());
        $detectado = new DetectedProductDTO('Dog Chow Adultos', 'Purina', '20 kg', 'Alimento', 5, 'Bolsa', 0.96);

        $resultado = $accion($this->empresa->id, $detectado, TipoMovimiento::Entrada);

        $this->assertFalse($resultado->esProductoNuevo);
        $this->assertSame($productoExistente->id, $resultado->producto->id);
        $this->assertDatabaseCount('productos', 1);
    }

    public function test_salida_reduces_stock_and_entrada_increases_it(): void
    {
        config(['captura_ia.confidence_threshold' => 0.85]);

        $accion = $this->accion();

        $entrada = new DetectedProductDTO('Dog Chow Adultos', 'Purina', '20 kg', 'Alimento', 10, 'Bolsa', 0.96);
        $resultadoEntrada = $accion($this->empresa->id, $entrada, TipoMovimiento::Entrada);
        $this->assertSame(10.0, (float) $resultadoEntrada->producto->stock_actual);

        $salida = new DetectedProductDTO('Dog Chow Adultos', 'Purina', '20 kg', 'Alimento', 4, 'Bolsa', 0.96);
        $resultadoSalida = $accion($this->empresa->id, $salida, TipoMovimiento::Salida);
        $this->assertSame(6.0, (float) $resultadoSalida->producto->stock_actual);
    }

    private function accion(): ApplyInventoryMovementAction
    {
        return new ApplyInventoryMovementAction(
            new ProductService(new ProductRepository()),
            new InventoryService(),
        );
    }
}
