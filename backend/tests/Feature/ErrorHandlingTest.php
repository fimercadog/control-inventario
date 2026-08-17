<?php

namespace Tests\Feature;

use App\Contracts\AI\AIProviderInterface;
use App\Exceptions\AIProviderException;
use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * RC1, punto 5: "No raw exceptions. No stack traces. No JSON errors."
 * Ninguna respuesta de la API debe filtrar nunca una excepción cruda,
 * sin importar APP_DEBUG, y los mensajes deben estar en español.
 */
class ErrorHandlingTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_nonexistent_api_route_returns_the_clean_error_envelope(): void
    {
        $response = $this->getJson('/api/v1/no-existe');

        $response->assertStatus(404);
        $response->assertJson([
            'success' => false,
            'message' => 'No encontramos el recurso solicitado.',
        ]);
        $response->assertJsonMissingPath('exception');
        $response->assertJsonMissingPath('trace');
        $response->assertJsonMissingPath('file');
        $response->assertJsonMissingPath('line');
    }

    public function test_an_unauthenticated_request_without_a_json_accept_header_still_gets_a_clean_401(): void
    {
        // Sin Accept: application/json, expectsJson() es false y Laravel
        // por defecto intenta redirigir a route('login') — que no existe
        // en esta API — y explota en un 500 crudo si no se desactiva
        // ese redirect (bootstrap/app.php, redirectGuestsTo).
        $response = $this->get('/api/v1/auth/me');

        $response->assertStatus(401);
        $response->assertJsonPath('message', 'Debes iniciar sesión para continuar.');
        $response->assertJsonMissingPath('exception');
    }

    public function test_a_disallowed_http_method_returns_the_clean_error_envelope(): void
    {
        $response = $this->deleteJson('/api/v1/captura-ia/foto');

        $response->assertStatus(405);
        $response->assertJson(['success' => false]);
        $response->assertJsonMissingPath('exception');
    }

    public function test_validation_errors_are_returned_in_spanish(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $this->actingAs(User::factory()->create(['empresa_id' => $empresa->id]), 'api');

        $response = $this->postJson('/api/v1/captura-ia/foto', []);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Error de validación');
        $response->assertJsonPath('errors.imagen.0', 'El campo imagen es obligatorio.');
    }

    public function test_an_ai_provider_failure_never_leaks_the_vendor_message_or_status_code(): void
    {
        Storage::fake('local');
        $this->seed(PermissionSeeder::class);
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $usuario = User::factory()->create(['empresa_id' => $empresa->id]);

        // Payload válido (imagen real) para que la request pase la
        // validación y llegue a authorize('create', ...) — Fase 4.6 exige
        // captura-ia.usar ahí; el foco de este test es el manejo de
        // errores del proveedor de IA, no la autorización en sí.
        app(PermissionRegistrar::class)->setPermissionsTeamId($empresa->id);
        $rol = Role::create(['name' => 'Test Captura IA', 'guard_name' => 'api', 'empresa_id' => $empresa->id]);
        $rol->givePermissionTo('captura-ia.usar');
        $usuario->assignRole($rol);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->actingAs($usuario, 'api');

        $this->app->bind(AIProviderInterface::class, fn () => new class implements AIProviderInterface {
            public function name(): string
            {
                return 'openai';
            }

            public function analyzeImage(string $imagePath): \App\DTO\AI\AIExtractionResultDTO
            {
                throw new AIProviderException('OpenAI Vision respondió con error: 401');
            }

            public function transcribeAudio(string $audioPath): string
            {
                throw new AIProviderException('OpenAI Speech to Text respondió con error: 401');
            }

            public function extractStructured(string $text, array $productosContexto = []): \App\DTO\AI\AIExtractionResultDTO
            {
                throw new AIProviderException('OpenAI Responses API respondió con error: 401');
            }
        });

        $response = $this->postJson('/api/v1/captura-ia/foto', [
            'empresa_id' => $empresa->id,
            'imagen' => UploadedFile::fake()->create('foto.jpg', 100, 'image/jpeg'),
        ]);

        $response->assertStatus(502);
        $response->assertJson(['success' => false, 'message' => 'No pudimos analizar tu captura. Intenta de nuevo en unos minutos.']);
        $response->assertJsonMissingPath('exception');
        $this->assertStringNotContainsString('OpenAI', $response->getContent());
        $this->assertStringNotContainsString('401', $response->getContent());
    }
}
