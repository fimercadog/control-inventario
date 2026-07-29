<?php

namespace Tests\Unit\CapturaIA;

use App\Contracts\AI\AIProviderInterface;
use App\DTO\AI\StructuredExtractionDTO;
use App\DTO\CapturaIA\CaptureInputDTO;
use App\Enums\CapturaIA\TipoCaptura;
use App\Enums\TipoMovimiento;
use App\Events\AICaptureCompleted;
use App\Events\InventoryMovementRegistered;
use App\Events\ProductCreated;
use App\Events\StockUpdated;
use App\Exceptions\StockInsuficienteException;
use App\Models\Empresa;
use App\Models\Producto;
use App\Services\Auth\TenantContext;
use App\Services\CapturaIA\CapturaIAService;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\Support\Fakes\FakeAIProvider;
use Tests\TestCase;

/**
 * Revisión de arquitectura final antes de Fase 4 (frontend): transacciones
 * atómicas, eventos de dominio e idempotencia (sección 74 del master spec,
 * puntos 4, 5 y 6).
 */
class ArchitectureReviewTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create(['nombre' => 'Fidel OS']);
        app(TenantContext::class)->setEmpresaId($this->empresa->id);
    }

    public function test_a_failure_mid_capture_rolls_back_every_product_and_movement_already_written(): void
    {
        $empresa = $this->empresa;

        // Producto ya existente con stock suficiente: su detección se
        // aplicaría con éxito si fuera la única de la captura.
        $existente = Producto::create([
            'empresa_id' => $empresa->id,
            'nombre' => 'Ya Existe',
            'marca' => null,
            'presentacion' => null,
        ]);
        (new InventoryService())->registrarMovimiento($existente, TipoMovimiento::Entrada, 100);

        // Toda la captura es "salida": la segunda detección es un producto
        // nuevo (stock 0), así que su salida de 3 unidades deja stock
        // negativo y debe abortar la transacción COMPLETA.
        $productos = [
            ['name' => 'Ya Existe', 'brand' => null, 'presentation' => null, 'category' => null, 'quantity' => 5, 'unit' => null, 'confidence' => 0.95],
            ['name' => 'Producto Nuevo', 'brand' => null, 'presentation' => null, 'category' => null, 'quantity' => 3, 'unit' => null, 'confidence' => 0.95],
        ];

        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray(['products' => $productos, 'movement' => 'salida']),
        ));

        $this->expectException(StockInsuficienteException::class);

        try {
            app(CapturaIAService::class)->procesar(new CaptureInputDTO(
                tipo: TipoCaptura::Foto,
                empresaId: $empresa->id,
                usuarioId: null,
                imagenPath: 'fake/foto.jpg',
            ));
        } finally {
            // El movimiento de "Ya Existe" (la primera detección, ya
            // aplicada con éxito antes de que la segunda fallara) debe
            // haber sido revertido junto con todo lo demás.
            $this->assertSame(100.0, (float) $existente->fresh()->stock_actual);
            $this->assertDatabaseCount('movimientos', 1); // solo el "Entrada" del setup
            $this->assertDatabaseMissing('productos', ['nombre' => 'Producto Nuevo']);
            $this->assertDatabaseCount('capturas_ia', 0);
            $this->assertDatabaseCount('audit_logs', 0);
        }
    }

    public function test_domain_events_are_dispatched_after_a_successful_capture(): void
    {
        // Fake solo estos 4 eventos: un Event::fake() sin argumentos también
        // intercepta los eventos internos eloquent.creating de los que
        // depende la generación automática de uuid (CapturaIA, AuditLog).
        Event::fake([
            ProductCreated::class,
            StockUpdated::class,
            InventoryMovementRegistered::class,
            AICaptureCompleted::class,
        ]);

        $empresa = $this->empresa;
        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray([
                'products' => [['name' => 'Dog Chow', 'brand' => 'Purina', 'presentation' => '20kg', 'category' => 'Alimento', 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.96]],
                'movement' => 'entrada',
            ]),
        ));

        app(CapturaIAService::class)->procesar(new CaptureInputDTO(
            tipo: TipoCaptura::Foto,
            empresaId: $empresa->id,
            usuarioId: null,
            imagenPath: 'fake/foto.jpg',
        ));

        Event::assertDispatched(ProductCreated::class);
        Event::assertDispatched(StockUpdated::class);
        Event::assertDispatched(InventoryMovementRegistered::class);
        Event::assertDispatched(AICaptureCompleted::class);
    }

    public function test_events_are_not_dispatched_when_the_capture_transaction_rolls_back(): void
    {
        Event::fake([
            ProductCreated::class,
            StockUpdated::class,
            InventoryMovementRegistered::class,
            AICaptureCompleted::class,
        ]);

        $empresa = $this->empresa;

        // Salida directa sobre un producto nuevo (stock 0): falla siempre.
        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray([
                'products' => [['name' => 'Producto Nuevo', 'brand' => null, 'presentation' => null, 'category' => null, 'quantity' => 3, 'unit' => null, 'confidence' => 0.95]],
                'movement' => 'salida',
            ]),
        ));

        try {
            app(CapturaIAService::class)->procesar(new CaptureInputDTO(
                tipo: TipoCaptura::Foto,
                empresaId: $empresa->id,
                usuarioId: null,
                imagenPath: 'fake/foto.jpg',
            ));
        } catch (StockInsuficienteException) {
            // esperado
        }

        // DB::afterCommit nunca dispara si la transacción nunca hizo commit.
        Event::assertNotDispatched(ProductCreated::class);
        Event::assertNotDispatched(StockUpdated::class);
        Event::assertNotDispatched(InventoryMovementRegistered::class);
        Event::assertNotDispatched(AICaptureCompleted::class);
    }

    public function test_processing_the_same_idempotency_key_twice_does_not_duplicate_inventory(): void
    {
        $empresa = $this->empresa;

        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray([
                'products' => [['name' => 'Dog Chow', 'brand' => 'Purina', 'presentation' => '20kg', 'category' => 'Alimento', 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.96]],
                'movement' => 'entrada',
            ]),
        ));

        $input = new CaptureInputDTO(
            tipo: TipoCaptura::Foto,
            empresaId: $empresa->id,
            usuarioId: null,
            imagenPath: 'fake/foto.jpg',
            idempotencyKey: 'retry-key-123',
        );

        $servicio = app(CapturaIAService::class);
        $primera = $servicio->procesar($input);
        // Simula un reintento de red/navegador/app móvil: misma clave, nueva
        // instancia del DTO (como llegaría en una segunda request HTTP real).
        $segunda = $servicio->procesar(new CaptureInputDTO(
            tipo: TipoCaptura::Foto,
            empresaId: $empresa->id,
            usuarioId: null,
            imagenPath: 'fake/otra-ruta.jpg',
            idempotencyKey: 'retry-key-123',
        ));

        $this->assertSame($primera->uuid, $segunda->uuid);
        $this->assertDatabaseCount('capturas_ia', 1);
        $this->assertDatabaseCount('productos', 1);
        $this->assertDatabaseCount('movimientos', 1);
        $this->assertDatabaseCount('audit_logs', 1);
    }

    public function test_different_idempotency_keys_are_processed_independently(): void
    {
        $empresa = $this->empresa;

        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray([
                'products' => [['name' => 'Dog Chow', 'brand' => 'Purina', 'presentation' => '20kg', 'category' => 'Alimento', 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.96]],
                'movement' => 'entrada',
            ]),
        ));

        $servicio = app(CapturaIAService::class);
        $servicio->procesar(new CaptureInputDTO(TipoCaptura::Foto, $empresa->id, null, imagenPath: 'a.jpg', idempotencyKey: 'clave-a'));
        $servicio->procesar(new CaptureInputDTO(TipoCaptura::Foto, $empresa->id, null, imagenPath: 'b.jpg', idempotencyKey: 'clave-b'));

        $this->assertDatabaseCount('capturas_ia', 2);
        // Mismo producto detectado ambas veces -> misma fila, stock sumado.
        $this->assertSame(10.0, (float) Producto::first()->stock_actual);
    }
}
