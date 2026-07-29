<?php

namespace Tests\Feature\Security;

use App\Contracts\AI\AIProviderInterface;
use App\DTO\AI\StructuredExtractionDTO;
use App\Models\CapturaIA;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Fakes\FakeAIProvider;
use Tests\TestCase;

/**
 * Módulo 2 — Company Isolation. La única superficie REST real hoy es
 * Captura IA (Productos/Movimientos no tienen endpoint todavía); estos
 * tests prueban el aislamiento end-to-end, a través de HTTP real, tal
 * como lo intentaría un atacante autenticado de otra empresa.
 */
class CompanyIsolationHttpTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
    }

    private function bindFakeProvider(): void
    {
        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray([
                'products' => [['name' => 'Dog Chow Adultos', 'brand' => 'Purina', 'presentation' => '20 kg', 'category' => 'Alimento', 'quantity' => 5, 'unit' => 'Bolsa', 'confidence' => 0.96]],
                'movement' => 'entrada',
            ]),
        ));
    }

    private function crearCapturaParaEmpresaB(): CapturaIA
    {
        $this->bindFakeProvider();
        $this->actingAs($this->userB, 'api');

        $respuesta = $this->postJson('/api/v1/captura-ia/foto', [
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ])->assertCreated();

        return CapturaIA::withoutGlobalScopes()->where('uuid', $respuesta->json('data.id'))->firstOrFail();
    }

    /**
     * Confianza baja a propósito: la captura queda `pendiente_revision`
     * (nunca `aplicado`), para que "Company A intenta confirmar/descartar"
     * sea una prueba significativa — si el aislamiento fallara, el estado
     * SÍ cambiaría, y eso es justo lo que la aserción debe detectar.
     */
    private function crearCapturaPendienteParaEmpresaB(): CapturaIA
    {
        $this->app->bind(AIProviderInterface::class, fn () => new FakeAIProvider(
            resultadoImagen: StructuredExtractionDTO::fromArray([
                'products' => [['name' => 'Producto Dudoso', 'brand' => null, 'presentation' => null, 'category' => null, 'quantity' => 3, 'unit' => null, 'confidence' => 0.4]],
                'movement' => 'entrada',
            ]),
        ));
        $this->actingAs($this->userB, 'api');

        $respuesta = $this->postJson('/api/v1/captura-ia/foto', [
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ])->assertCreated();

        $captura = CapturaIA::withoutGlobalScopes()->where('uuid', $respuesta->json('data.id'))->firstOrFail();
        $this->assertSame('pendiente_revision', $captura->estado->value);

        return $captura;
    }

    // 1. "Company A accesses another company's capture" (GET).
    public function test_company_a_cannot_view_company_bs_capture(): void
    {
        $capturaB = $this->crearCapturaParaEmpresaB();

        $this->actingAs($this->userA, 'api');
        $response = $this->getJson("/api/v1/captura-ia/{$capturaB->uuid}");

        $response->assertStatus(404);
        $response->assertJsonMissingPath('exception');
        $response->assertJsonMissingPath('data.id');
        $this->assertStringNotContainsString('Dog Chow Adultos', $response->getContent());
    }

    // "Company A uses guessed UUIDs" — well-formed but nonexistent.
    public function test_a_well_formed_but_nonexistent_uuid_fails_cleanly(): void
    {
        $this->actingAs($this->userA, 'api');

        $response = $this->getJson('/api/v1/captura-ia/'.\Illuminate\Support\Str::uuid());

        $response->assertStatus(404);
        $response->assertJsonMissingPath('exception');
    }

    // 2/3. "Company A modifies/deletes Company B's [capture]" — confirmar/descartar.
    public function test_company_a_cannot_confirm_company_bs_capture(): void
    {
        $capturaB = $this->crearCapturaPendienteParaEmpresaB();

        $this->actingAs($this->userA, 'api');
        $response = $this->postJson("/api/v1/captura-ia/{$capturaB->uuid}/confirmar");

        $response->assertStatus(404);
        $this->assertSame('pendiente_revision', $capturaB->fresh()->estado->value);
    }

    public function test_company_a_cannot_discard_company_bs_capture(): void
    {
        $capturaB = $this->crearCapturaPendienteParaEmpresaB();

        $this->actingAs($this->userA, 'api');
        $response = $this->postJson("/api/v1/captura-ia/{$capturaB->uuid}/descartar");

        $response->assertStatus(404);
        $this->assertSame('pendiente_revision', $capturaB->fresh()->estado->value);
    }

    // "Company A uses nested resources" — detalle de la captura de otra empresa.
    public function test_company_a_cannot_correct_a_detail_of_company_bs_capture(): void
    {
        $capturaB = $this->crearCapturaPendienteParaEmpresaB()->load('detalles');
        $detalleId = $capturaB->detalles->first()->id;

        $this->actingAs($this->userA, 'api');
        $response = $this->patchJson("/api/v1/captura-ia/{$capturaB->uuid}/detalle/{$detalleId}", [
            'nombre_detectado' => 'Nombre Hackeado',
        ]);

        $response->assertStatus(404);
        $this->assertNotSame('Nombre Hackeado', $capturaB->detalles->first()->fresh()->nombre_detectado);
    }

    // "Company A attempts mass-assignment of empresa_id" / "manipulates request payloads".
    public function test_a_forged_empresa_id_in_the_payload_is_ignored_on_create(): void
    {
        $this->bindFakeProvider();
        $this->actingAs($this->userA, 'api');

        $response = $this->postJson('/api/v1/captura-ia/foto', [
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
            'empresa_id' => $this->empresaB->id, // forjado: A intenta escribir como si fuera B
        ]);

        $response->assertCreated();
        $uuid = $response->json('data.id');

        $creada = CapturaIA::withoutGlobalScopes()->where('uuid', $uuid)->firstOrFail();
        $this->assertSame($this->empresaA->id, $creada->empresa_id, 'El empresa_id forjado en el body debe ignorarse por completo.');
        $this->assertNotSame($this->empresaB->id, $creada->empresa_id);
    }

    // Ídem para el query string en index().
    public function test_a_forged_empresa_id_in_the_query_string_is_ignored_on_index(): void
    {
        $this->crearCapturaParaEmpresaB();

        $this->actingAs($this->userA, 'api');
        $response = $this->getJson('/api/v1/captura-ia?empresa_id='.$this->empresaB->id);

        $response->assertOk();
        $response->assertJsonCount(0, 'data.items');
        $response->assertJsonPath('data.meta.total', 0);
    }

    // "Company A paginates" / "searches globally": el total nunca cuenta filas de otra empresa.
    public function test_pagination_metadata_never_reflects_another_companys_records(): void
    {
        $this->crearCapturaParaEmpresaB();
        $this->crearCapturaParaEmpresaB();

        $this->bindFakeProvider();
        $this->actingAs($this->userA, 'api');
        $this->postJson('/api/v1/captura-ia/foto', [
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ])->assertCreated();

        $response = $this->getJson('/api/v1/captura-ia');

        $response->assertOk();
        $response->assertJsonCount(1, 'data.items');
        $response->assertJsonPath('data.meta.total', 1);
    }

    // "Company A uses API replay" con una idempotency-key que ya usó OTRA empresa.
    public function test_replaying_another_companys_idempotency_key_does_not_leak_their_capture(): void
    {
        $this->bindFakeProvider();

        $this->actingAs($this->userB, 'api');
        $original = $this->withHeader('Idempotency-Key', 'shared-key-guessed')
            ->postJson('/api/v1/captura-ia/foto', [
                'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
            ])->assertCreated();

        $this->actingAs($this->userA, 'api');
        $response = $this->withHeader('Idempotency-Key', 'shared-key-guessed')
            ->postJson('/api/v1/captura-ia/foto', [
                'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
            ]);

        $response->assertCreated(); // 201, no 200: es una captura NUEVA, no la de B
        $this->assertNotSame($original->json('data.id'), $response->json('data.id'));

        $nueva = CapturaIA::withoutGlobalScopes()->where('uuid', $response->json('data.id'))->firstOrFail();
        $this->assertSame($this->empresaA->id, $nueva->empresa_id);
    }

    // Platform admin (sin empresa) no puede capturar — falla limpio, no truena en la constraint NOT NULL.
    public function test_a_platform_admin_without_empresa_gets_a_clean_error_on_capture_endpoints(): void
    {
        $admin = User::factory()->create(['empresa_id' => null, 'is_platform_admin' => true]);
        $this->actingAs($admin, 'api');

        $response = $this->postJson('/api/v1/captura-ia/foto', [
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ]);

        $response->assertStatus(403);
        $response->assertJsonMissingPath('exception');
    }
}
