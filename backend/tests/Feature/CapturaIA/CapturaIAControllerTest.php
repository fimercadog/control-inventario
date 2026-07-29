<?php

namespace Tests\Feature\CapturaIA;

use App\Contracts\AI\AIProviderInterface;
use App\DTO\AI\StructuredExtractionDTO;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Fakes\FakeAIProvider;
use Tests\TestCase;

class CapturaIAControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    public function test_post_foto_stores_original_image_and_returns_the_processed_capture(): void
    {
        $empresa = $this->crearEmpresaAutenticada();
        $this->bindFakeProvider(imagen: [
            ['name' => 'Dog Chow Adultos', 'brand' => 'Purina', 'presentation' => '20 kg', 'category' => 'Alimento', 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.96],
        ]);

        $respuesta = $this->postJson('/api/v1/captura-ia/foto', [
            'empresa_id' => $empresa->id,
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ]);

        $respuesta->assertCreated();
        $respuesta->assertJsonPath('success', true);
        $respuesta->assertJsonPath('data.estado', 'aplicado');
        $respuesta->assertJsonPath('data.products.0.name', 'Dog Chow Adultos');
        $respuesta->assertJsonPath('data.products.0.quantity', 5);

        $uuid = $respuesta->json('data.id');
        $this->assertNotEmpty($uuid);

        $this->assertDatabaseHas('capturas_ia', ['uuid' => $uuid]);
        $this->assertDatabaseCount('audit_logs', 1);

        // El archivo original (no procesado) debe haberse guardado, no solo el dato extraído.
        Storage::disk('local')->assertExists("capturas-ia/{$empresa->id}/{$uuid}/foto.jpg");
    }

    public function test_post_voz_processes_a_spoken_movement(): void
    {
        $empresa = $this->crearEmpresaAutenticada();
        $this->bindFakeProvider(
            texto: [['name' => 'Dog Chow Adultos', 'brand' => 'Purina', 'presentation' => null, 'category' => null, 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.9]],
            transcripcion: 'Entraron cinco bolsas de Dog Chow Adultos.',
        );

        $respuesta = $this->postJson('/api/v1/captura-ia/voz', [
            'empresa_id' => $empresa->id,
            'audio' => UploadedFile::fake()->create('audio.wav', 100, 'audio/wav'),
        ]);

        $respuesta->assertCreated();
        $respuesta->assertJsonPath('data.transcripcion', 'Entraron cinco bolsas de Dog Chow Adultos.');
        $this->assertDatabaseCount('productos', 1);
        $this->assertDatabaseCount('movimientos', 1);
    }

    public function test_post_foto_voz_requires_both_files(): void
    {
        $empresa = $this->crearEmpresaAutenticada();

        $respuesta = $this->postJson('/api/v1/captura-ia/foto-voz', [
            'empresa_id' => $empresa->id,
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ]);

        $respuesta->assertStatus(422);
        $respuesta->assertJsonPath('success', false);
        $respuesta->assertJsonValidationErrors(['audio']);
    }

    public function test_low_confidence_detection_can_be_confirmed_manually(): void
    {
        $empresa = $this->crearEmpresaAutenticada();
        $this->bindFakeProvider(imagen: [
            ['name' => 'Producto Dudoso', 'brand' => null, 'presentation' => null, 'category' => null, 'quantity' => 3, 'unit' => null, 'confidence' => 0.4],
        ]);

        $creado = $this->postJson('/api/v1/captura-ia/foto', [
            'empresa_id' => $empresa->id,
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ])->assertCreated();

        $uuid = $creado->json('data.id');
        $creado->assertJsonPath('data.estado', 'pendiente_revision');
        $this->assertDatabaseCount('productos', 0);

        $confirmado = $this->postJson("/api/v1/captura-ia/{$uuid}/confirmar");

        $confirmado->assertOk();
        $confirmado->assertJsonPath('data.estado', 'aplicado');
        $this->assertDatabaseCount('productos', 1);
        $this->assertDatabaseCount('movimientos', 1);
    }

    public function test_pending_detail_can_be_corrected_before_confirming(): void
    {
        $empresa = $this->crearEmpresaAutenticada();
        $this->bindFakeProvider(imagen: [
            ['name' => 'Nombre Mal Leido', 'brand' => null, 'presentation' => null, 'category' => null, 'quantity' => 3, 'unit' => null, 'confidence' => 0.4],
        ]);

        $creado = $this->postJson('/api/v1/captura-ia/foto', [
            'empresa_id' => $empresa->id,
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ])->assertCreated();

        $uuid = $creado->json('data.id');
        $detalleId = $creado->json('data.products.0.id');

        $corregido = $this->patchJson("/api/v1/captura-ia/{$uuid}/detalle/{$detalleId}", [
            'nombre_detectado' => 'Dog Chow Adultos',
            'cantidad_detectada' => 5,
        ]);

        $corregido->assertOk();
        $corregido->assertJsonPath('data.name', 'Dog Chow Adultos');
        $corregido->assertJsonPath('data.estado', 'corregido');

        $this->postJson("/api/v1/captura-ia/{$uuid}/confirmar")->assertOk();

        $this->assertDatabaseHas('productos', ['nombre' => 'Dog Chow Adultos']);
    }

    public function test_capture_can_be_discarded(): void
    {
        $empresa = $this->crearEmpresaAutenticada();
        $this->bindFakeProvider(imagen: [
            ['name' => 'Producto Dudoso', 'brand' => null, 'presentation' => null, 'category' => null, 'quantity' => 3, 'unit' => null, 'confidence' => 0.4],
        ]);

        $creado = $this->postJson('/api/v1/captura-ia/foto', [
            'empresa_id' => $empresa->id,
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ])->assertCreated();

        $uuid = $creado->json('data.id');

        $descartado = $this->postJson("/api/v1/captura-ia/{$uuid}/descartar");

        $descartado->assertOk();
        $descartado->assertJsonPath('data.estado', 'descartado');
        $this->assertDatabaseCount('productos', 0);
        $this->assertDatabaseCount('movimientos', 0);
    }

    public function test_show_and_index_are_scoped_by_uuid_and_empresa(): void
    {
        $empresa = $this->crearEmpresaAutenticada();
        $this->bindFakeProvider(imagen: [
            ['name' => 'Dog Chow Adultos', 'brand' => 'Purina', 'presentation' => '20 kg', 'category' => 'Alimento', 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.96],
        ]);

        $creado = $this->postJson('/api/v1/captura-ia/foto', [
            'empresa_id' => $empresa->id,
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ])->assertCreated();

        $uuid = $creado->json('data.id');

        $this->getJson("/api/v1/captura-ia/{$uuid}")->assertOk()->assertJsonPath('data.id', $uuid);

        $this->getJson("/api/v1/captura-ia?empresa_id={$empresa->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_repeating_the_same_idempotency_key_header_returns_the_original_capture_without_reprocessing(): void
    {
        $empresa = $this->crearEmpresaAutenticada();
        $this->bindFakeProvider(imagen: [
            ['name' => 'Dog Chow Adultos', 'brand' => 'Purina', 'presentation' => '20 kg', 'category' => 'Alimento', 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.96],
        ]);

        $payload = [
            'empresa_id' => $empresa->id,
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ];

        $primera = $this->withHeader('Idempotency-Key', 'mobile-retry-abc')
            ->postJson('/api/v1/captura-ia/foto', $payload);
        $primera->assertCreated();

        // Reintento típico de app móvil / navegador tras un timeout de red:
        // misma clave, la request pudo o no haber llegado la primera vez.
        $segunda = $this->withHeader('Idempotency-Key', 'mobile-retry-abc')
            ->postJson('/api/v1/captura-ia/foto', [
                'empresa_id' => $empresa->id,
                'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
            ]);

        $segunda->assertOk(); // 200, no 201: no se creó nada nuevo
        $this->assertSame($primera->json('data.id'), $segunda->json('data.id'));
        $this->assertDatabaseCount('capturas_ia', 1);
        $this->assertDatabaseCount('productos', 1);
        $this->assertDatabaseCount('movimientos', 1);
    }

    /**
     * Todas las rutas de Captura IA exigen auth:api desde el Módulo 1
     * (docs/04_ARCHITECTURE.md); estas pruebas verifican el comportamiento
     * de negocio, no la autenticación en sí (eso vive en AuthenticationTest),
     * así que basta con `actingAs` en vez de un JWT real.
     */
    private function crearEmpresaAutenticada(): Empresa
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $this->actingAs(User::factory()->create(['empresa_id' => $empresa->id]), 'api');

        return $empresa;
    }

    /**
     * @param array<int, array<string, mixed>> $imagen
     * @param array<int, array<string, mixed>> $texto
     */
    private function bindFakeProvider(array $imagen = [], string $transcripcion = '', array $texto = []): void
    {
        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray(['products' => $imagen, 'movement' => 'entrada']),
            transcripcion: $transcripcion,
            resultadoTexto: StructuredExtractionDTO::fromArray(['products' => $texto, 'movement' => 'entrada']),
        ));
    }
}
