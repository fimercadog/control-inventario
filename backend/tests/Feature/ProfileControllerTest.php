<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\AuthSession;
use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Perfil (2026-08-02). Cada endpoint opera exclusivamente sobre
 * `$request->user()` — no hay `{id}` en ninguna ruta, así que no hay un
 * escenario de "usuario B edita el perfil de usuario A" que probar: es
 * estructuralmente imposible, no solo rechazado por una Policy.
 */
class ProfileControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->empresa = Empresa::create(['nombre' => 'Empresa A']);
        $this->user = User::factory()->create([
            'empresa_id' => $this->empresa->id,
            'password' => Hash::make('password-actual-123'),
        ]);
    }

    public function test_a_user_can_update_their_own_profile_fields(): void
    {
        $this->actingAs($this->user, 'api')
            ->patchJson('/api/v1/perfil', [
                'theme' => 'dark',
                'language' => 'en',
                'timezone' => 'America/Mexico_City',
            ])
            ->assertOk()
            ->assertJsonPath('data.theme', 'dark')
            ->assertJsonPath('data.language', 'en')
            ->assertJsonPath('data.timezone', 'America/Mexico_City');

        $this->assertDatabaseHas('users', ['id' => $this->user->id, 'theme' => 'dark']);
    }

    /**
     * `name` es un campo de identidad (ADR-015, modelo de identidad ERP) —
     * inmutable después de crear la cuenta, igual que `email`. Antes de
     * 2026-08-04 sí era editable desde aquí; se ignora en silencio desde
     * esta fecha, mismo patrón que `empresa_id` en Clientes/Proveedores.
     */
    public function test_name_cannot_be_changed_via_profile(): void
    {
        $nombreOriginal = $this->user->name;

        $this->actingAs($this->user, 'api')
            ->patchJson('/api/v1/perfil', ['name' => 'Nombre Que No Debería Guardarse', 'theme' => 'dark'])
            ->assertOk()
            ->assertJsonPath('data.name', $nombreOriginal);

        $this->assertSame($nombreOriginal, $this->user->fresh()->name);
        $this->assertSame('dark', $this->user->fresh()->theme);
    }

    /**
     * Antes de 2026-08-04, ninguna automodificación de perfil quedaba en
     * `AuditLog` — inconsistencia real frente a las mutaciones de
     * `UserController` (activar/desactivar/asignarRol), que sí auditaban.
     * Cerrado en la auditoría de campos editables de
     * Clientes/Proveedores/Usuarios.
     */
    public function test_updating_profile_writes_an_audit_log_with_only_the_changed_fields(): void
    {
        $this->actingAs($this->user, 'api')
            ->patchJson('/api/v1/perfil', ['timezone' => 'America/Mexico_City'])
            ->assertOk();

        $log = AuditLog::where('modulo', 'perfil')->where('accion', 'perfil.editar')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertSame('America/Mexico_City', $log->valores_nuevos['timezone'] ?? null);
        $this->assertArrayNotHasKey('theme', $log->valores_nuevos);
    }

    /** Nunca el hash ni el valor real de la contraseña dentro del log — solo la marca de que ocurrió. */
    public function test_changing_password_writes_an_audit_log_without_the_password_value(): void
    {
        $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/password', [
                'password_actual' => 'password-actual-123',
                'password' => 'password-nuevo-456',
                'password_confirmation' => 'password-nuevo-456',
            ])
            ->assertOk();

        $log = AuditLog::where('modulo', 'perfil')->where('accion', 'perfil.password_cambiado')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertSame('(cambiado)', $log->valores_nuevos['password'] ?? null);
        $this->assertStringNotContainsString('password-nuevo-456', json_encode($log->valores_nuevos));
    }

    public function test_updating_profile_only_touches_provided_fields(): void
    {
        $this->actingAs($this->user, 'api')
            ->patchJson('/api/v1/perfil', ['theme' => 'dark'])
            ->assertOk();

        $this->user->refresh();
        $this->assertSame('dark', $this->user->theme);
        $this->assertSame('es', $this->user->language);
    }

    public function test_theme_must_be_a_valid_option(): void
    {
        $this->actingAs($this->user, 'api')
            ->patchJson('/api/v1/perfil', ['theme' => 'neon'])
            ->assertStatus(422);
    }

    public function test_language_must_be_a_valid_option(): void
    {
        $this->actingAs($this->user, 'api')
            ->patchJson('/api/v1/perfil', ['language' => 'fr'])
            ->assertStatus(422);
    }

    public function test_timezone_must_be_a_valid_identifier(): void
    {
        $this->actingAs($this->user, 'api')
            ->patchJson('/api/v1/perfil', ['timezone' => 'No/Existe'])
            ->assertStatus(422);
    }

    public function test_a_user_can_upload_an_avatar(): void
    {
        // ->create() con mimeType explícito, no ->image(): este entorno no
        // tiene la extensión GD que ->image() necesita para generar bytes
        // reales de imagen. Laravel confía en el mimeType declarado de un
        // UploadedFile::fake() en modo test, sin inspeccionar contenido.
        $archivo = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/avatar', ['avatar' => $archivo]);

        $response->assertOk();
        $this->user->refresh();
        $this->assertNotNull($this->user->avatar_path);
        Storage::disk('public')->assertExists($this->user->avatar_path);
        $this->assertStringContainsString('/storage/', $response->json('data.avatar_url'));
    }

    public function test_uploading_a_new_avatar_deletes_the_old_one(): void
    {
        $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/avatar', ['avatar' => UploadedFile::fake()->create('primero.jpg', 100, 'image/jpeg')]);
        $primeraRuta = $this->user->refresh()->avatar_path;

        $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/avatar', ['avatar' => UploadedFile::fake()->create('segundo.jpg', 100, 'image/jpeg')]);

        Storage::disk('public')->assertMissing($primeraRuta);
        Storage::disk('public')->assertExists($this->user->refresh()->avatar_path);
    }

    public function test_avatar_must_be_an_image(): void
    {
        $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/avatar', ['avatar' => UploadedFile::fake()->create('documento.pdf', 100)])
            ->assertStatus(422);
    }

    public function test_a_user_can_remove_their_avatar(): void
    {
        $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/avatar', ['avatar' => UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg')]);
        $ruta = $this->user->refresh()->avatar_path;

        $this->actingAs($this->user, 'api')
            ->deleteJson('/api/v1/perfil/avatar')
            ->assertOk()
            ->assertJsonPath('data.avatar_path', null);

        Storage::disk('public')->assertMissing($ruta);
        $this->assertNull($this->user->refresh()->avatar_path);
    }

    public function test_a_user_can_change_their_own_password_with_the_correct_current_password(): void
    {
        $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/password', [
                'password_actual' => 'password-actual-123',
                'password' => 'password-nueva-456',
                'password_confirmation' => 'password-nueva-456',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('password-nueva-456', $this->user->refresh()->password));
    }

    public function test_changing_password_with_the_wrong_current_password_is_rejected(): void
    {
        $response = $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/password', [
                'password_actual' => 'password-incorrecta',
                'password' => 'password-nueva-456',
                'password_confirmation' => 'password-nueva-456',
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password_actual');
        $this->assertTrue(Hash::check('password-actual-123', $this->user->refresh()->password));
    }

    public function test_changing_password_revokes_all_sessions(): void
    {
        AuthSession::create([
            'user_id' => $this->user->id,
            'refresh_token_hash' => hash('sha256', 'token-de-prueba'),
            'remember_me' => false,
            'last_used_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/password', [
                'password_actual' => 'password-actual-123',
                'password' => 'password-nueva-456',
                'password_confirmation' => 'password-nueva-456',
            ])
            ->assertOk();

        $this->assertNotNull(AuthSession::where('user_id', $this->user->id)->first()->revoked_at);
    }

    public function test_new_password_requires_confirmation_and_minimum_length(): void
    {
        $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/password', [
                'password_actual' => 'password-actual-123',
                'password' => 'short',
                'password_confirmation' => 'short',
            ])
            ->assertStatus(422);

        $this->actingAs($this->user, 'api')
            ->postJson('/api/v1/perfil/password', [
                'password_actual' => 'password-actual-123',
                'password' => 'password-nueva-456',
                'password_confirmation' => 'no-coincide',
            ])
            ->assertStatus(422);
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->patchJson('/api/v1/perfil', ['name' => 'X'])->assertStatus(401);
        $this->postJson('/api/v1/perfil/avatar', [])->assertStatus(401);
        $this->deleteJson('/api/v1/perfil/avatar')->assertStatus(401);
        $this->postJson('/api/v1/perfil/password', [])->assertStatus(401);
    }
}
