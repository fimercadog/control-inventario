<?php

namespace Tests\Unit\CapturaIA;

use App\Contracts\AI\AIProviderInterface;
use App\DTO\CapturaIA\CaptureInputDTO;
use App\DTO\AI\StructuredExtractionDTO;
use App\Enums\CapturaIA\EstadoCaptura;
use App\Enums\CapturaIA\TipoCaptura;
use App\Models\AuditLog;
use App\Models\Empresa;
use App\Services\CapturaIA\CapturaIAService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\Fakes\FakeAIProvider;
use Tests\TestCase;

class CapturaIAServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_photo_with_several_identical_products_creates_a_single_product_with_summed_quantity(): void
    {
        // Ejemplo del brief: 15 Coca Cola 350ml -> 1 producto, cantidad 15.
        $productos = array_fill(0, 15, [
            'name' => 'Coca Cola', 'brand' => 'Coca-Cola', 'presentation' => '350ml',
            'category' => 'Bebida', 'quantity' => 1, 'unit' => 'Lata', 'confidence' => 0.95,
        ]);

        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray(['products' => $productos, 'movement' => 'entrada']),
        ));

        $captura = app(CapturaIAService::class)->procesar(new CaptureInputDTO(
            tipo: TipoCaptura::Foto,
            empresaId: $this->crearEmpresa(),
            usuarioId: null,
            imagenPath: 'fake/foto.jpg',
        ));

        $this->assertSame(EstadoCaptura::Aplicado, $captura->estado);
        $this->assertCount(1, $captura->detalles);
        $this->assertSame(15.0, (float) $captura->detalles->first()->cantidad_detectada);
        $this->assertSame(15.0, (float) $captura->detalles->first()->producto->stock_actual);
    }

    public function test_photo_with_different_products_creates_one_entry_per_product(): void
    {
        // Ejemplo del brief: 5 Coca Cola, 8 Pepsi, 3 Sprite, 2 Agua Cristal.
        $productos = [
            ['name' => 'Coca Cola', 'brand' => 'Coca-Cola', 'presentation' => '350ml', 'category' => 'Bebida', 'quantity' => 5, 'unit' => 'Lata', 'confidence' => 0.95],
            ['name' => 'Pepsi', 'brand' => 'PepsiCo', 'presentation' => '350ml', 'category' => 'Bebida', 'quantity' => 8, 'unit' => 'Lata', 'confidence' => 0.93],
            ['name' => 'Sprite', 'brand' => 'Coca-Cola', 'presentation' => '350ml', 'category' => 'Bebida', 'quantity' => 3, 'unit' => 'Lata', 'confidence' => 0.9],
            ['name' => 'Agua Cristal', 'brand' => null, 'presentation' => '600ml', 'category' => 'Bebida', 'quantity' => 2, 'unit' => 'Botella', 'confidence' => 0.88],
        ];

        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray(['products' => $productos, 'movement' => 'entrada']),
        ));

        $captura = app(CapturaIAService::class)->procesar(new CaptureInputDTO(
            tipo: TipoCaptura::Foto,
            empresaId: $this->crearEmpresa(),
            usuarioId: null,
            imagenPath: 'fake/foto.jpg',
        ));

        $this->assertCount(4, $captura->detalles);
        $this->assertDatabaseCount('productos', 4);
        $this->assertDatabaseCount('movimientos', 4);
    }

    public function test_mixed_confidence_leaves_capture_partial(): void
    {
        $productos = [
            ['name' => 'Dog Chow', 'brand' => 'Purina', 'presentation' => '20kg', 'category' => 'Alimento', 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.96],
            ['name' => 'Producto Dudoso', 'brand' => null, 'presentation' => null, 'category' => null, 'quantity' => 2, 'unit' => null, 'confidence' => 0.3],
        ];

        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray(['products' => $productos, 'movement' => 'entrada']),
        ));

        $captura = app(CapturaIAService::class)->procesar(new CaptureInputDTO(
            tipo: TipoCaptura::Foto,
            empresaId: $this->crearEmpresa(),
            usuarioId: null,
            imagenPath: 'fake/foto.jpg',
        ));

        $this->assertSame(EstadoCaptura::Parcial, $captura->estado);
        $this->assertDatabaseCount('productos', 1);
    }

    public function test_voice_only_registers_a_movement_for_the_named_product(): void
    {
        $resultado = StructuredExtractionDTO::fromArray([
            'products' => [[
                'name' => 'Dog Chow Adultos', 'brand' => 'Purina', 'presentation' => null,
                'category' => null, 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.9,
            ]],
            'movement' => 'entrada',
        ]);

        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            transcripcion: 'Entraron cinco bolsas de Dog Chow Adultos.',
            resultadoTexto: $resultado,
        ));

        $captura = app(CapturaIAService::class)->procesar(new CaptureInputDTO(
            tipo: TipoCaptura::Voz,
            empresaId: $this->crearEmpresa(),
            usuarioId: null,
            audioPath: 'fake/audio.wav',
        ));

        $this->assertSame('Entraron cinco bolsas de Dog Chow Adultos.', $captura->transcripcion);
        $this->assertDatabaseCount('productos', 1);
        $this->assertDatabaseCount('movimientos', 1);
    }

    public function test_photo_plus_voice_uses_photo_identity_and_voice_quantity(): void
    {
        $resultadoFoto = StructuredExtractionDTO::fromArray([
            'products' => [[
                'name' => 'Dog Chow', 'brand' => 'Purina', 'presentation' => '20kg',
                'category' => 'Alimento', 'quantity' => 1, 'unit' => 'Bolsa', 'confidence' => 0.9,
            ]],
            'movement' => 'entrada',
        ]);
        $resultadoVoz = StructuredExtractionDTO::fromArray([
            'products' => [[
                'name' => 'Dog Chow', 'brand' => null, 'presentation' => null,
                'category' => null, 'quantity' => 5, 'unit' => null, 'confidence' => 0.95,
            ]],
            'movement' => 'entrada',
        ]);

        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: $resultadoFoto,
            transcripcion: 'Entraron cinco.',
            resultadoTexto: $resultadoVoz,
        ));

        $captura = app(CapturaIAService::class)->procesar(new CaptureInputDTO(
            tipo: TipoCaptura::FotoVoz,
            empresaId: $this->crearEmpresa(),
            usuarioId: null,
            imagenPath: 'fake/foto.jpg',
            audioPath: 'fake/audio.wav',
        ));

        $this->assertCount(1, $captura->detalles);
        $this->assertSame(5.0, (float) $captura->detalles->first()->cantidad_detectada);
        $this->assertSame('Dog Chow', $captura->detalles->first()->nombre_detectado);
        $this->assertSame(5.0, (float) $captura->detalles->first()->producto->stock_actual);
    }

    public function test_every_capture_gets_a_uuid_and_an_audit_log_entry(): void
    {
        $resultado = StructuredExtractionDTO::fromArray([
            'products' => [[
                'name' => 'Dog Chow', 'brand' => 'Purina', 'presentation' => '20kg',
                'category' => 'Alimento', 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.96,
            ]],
            'movement' => 'entrada',
        ]);

        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(resultadoImagen: $resultado));

        $captura = app(CapturaIAService::class)->procesar(
            new CaptureInputDTO(
                tipo: TipoCaptura::Foto,
                empresaId: $this->crearEmpresa(),
                usuarioId: null,
                imagenPath: 'fake/foto.jpg',
            ),
            ip: '127.0.0.1',
            userAgent: 'PHPUnit',
        );

        $this->assertNotEmpty($captura->uuid);
        $this->assertDatabaseCount('audit_logs', 1);

        $log = AuditLog::first();
        $this->assertSame('captura_ia', $log->modulo);
        $this->assertSame($captura->id, $log->auditable_id);
        $this->assertSame('fake', $log->valores_nuevos['proveedor']);
        $this->assertSame('127.0.0.1', $log->ip);
    }

    private function crearEmpresa(): int
    {
        return Empresa::create(['nombre' => 'Fidel OS'])->id;
    }
}
