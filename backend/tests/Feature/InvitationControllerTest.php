<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Invitation;
use App\Models\Role;
use App\Models\User;
use App\Notifications\Auth\InvitationNotification;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Módulo 6 — Invitaciones (2026-08-03, docs/03_FUNCTIONAL_SPEC/Users.md,
 * Decisión 1). Único mecanismo real de alta de usuarios de este ERP.
 * `store()` (POST /usuarios/invitar) requiere sesión + `usuarios.invitar`;
 * `show()`/`aceptar()` (GET/POST /invitaciones/{token}) son deliberadamente
 * públicas — se prueban creando una `Invitation` directamente con un
 * token crudo conocido, en vez de interceptar el correo real, para aislar
 * esa mitad del flujo del envío de notificaciones.
 */
class InvitationControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $adminA;

    private User $userSinPermiso;

    private Role $roleA;

    private Role $roleB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);

        $registrar = app(PermissionRegistrar::class);
        $context = app(TenantContext::class);

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolAdmin = Role::create(['name' => 'Administrador', 'guard_name' => 'api']);
        $rolAdmin->givePermissionTo('usuarios.invitar');
        $this->roleA = Role::create(['name' => 'Bodeguero', 'guard_name' => 'api']);

        $this->adminA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->adminA->assignRole($rolAdmin);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaB->id);
        $registrar->setPermissionsTeamId($this->empresaB->id);
        $this->roleB = Role::create(['name' => 'Rol de Empresa B', 'guard_name' => 'api']);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
    }

    /**
     * Crea una invitación directamente (sin pasar por el endpoint de
     * invitar) con un token crudo conocido — aísla las pruebas de
     * `show()`/`aceptar()` del envío real de notificaciones.
     */
    private function crearInvitacion(array $overrides = []): array
    {
        $rawToken = 'token-de-prueba-'.uniqid();

        $invitacion = Invitation::create(array_merge([
            'email' => 'invitado@example.com',
            'empresa_id' => $this->empresaA->id,
            'role_id' => $this->roleA->id,
            'token_hash' => hash('sha256', $rawToken),
            'invited_by' => $this->adminA->id,
            'expires_at' => now()->addDays(7),
        ], $overrides));

        return [$invitacion, $rawToken];
    }

    public function test_a_user_with_permission_can_invite_a_new_user(): void
    {
        Notification::fake();

        $this->actingAs($this->adminA, 'api')
            ->postJson('/api/v1/usuarios/invitar', [
                'email' => 'nuevo@example.com',
                'role_id' => $this->roleA->id,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('invitations', [
            'email' => 'nuevo@example.com',
            'empresa_id' => $this->empresaA->id,
            'role_id' => $this->roleA->id,
        ]);

        Notification::assertSentOnDemand(
            InvitationNotification::class,
            fn ($notification, $channels, $notifiable) => $notifiable->routes['mail'] === 'nuevo@example.com'
        );
    }

    public function test_inviting_an_email_that_already_belongs_to_a_user_fails_validation(): void
    {
        Notification::fake();

        $this->actingAs($this->adminA, 'api')
            ->postJson('/api/v1/usuarios/invitar', ['email' => $this->userSinPermiso->email])
            ->assertStatus(422);

        Notification::assertNothingSent();
    }

    public function test_inviting_with_a_role_from_another_company_fails_validation(): void
    {
        $this->actingAs($this->adminA, 'api')
            ->postJson('/api/v1/usuarios/invitar', ['email' => 'nuevo@example.com', 'role_id' => $this->roleB->id])
            ->assertStatus(422);
    }

    public function test_re_inviting_the_same_email_replaces_the_pending_invitation(): void
    {
        Notification::fake();

        $this->actingAs($this->adminA, 'api')
            ->postJson('/api/v1/usuarios/invitar', ['email' => 'nuevo@example.com'])
            ->assertCreated();

        $this->actingAs($this->adminA, 'api')
            ->postJson('/api/v1/usuarios/invitar', ['email' => 'nuevo@example.com'])
            ->assertCreated();

        $this->assertSame(
            1,
            Invitation::where('email', 'nuevo@example.com')->whereNull('accepted_at')->count()
        );
    }

    public function test_a_user_without_permission_cannot_invite(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson('/api/v1/usuarios/invitar', ['email' => 'nuevo@example.com'])
            ->assertStatus(403);
    }

    public function test_unauthenticated_cannot_invite(): void
    {
        $this->postJson('/api/v1/usuarios/invitar', ['email' => 'nuevo@example.com'])
            ->assertUnauthorized();
    }

    public function test_get_invitation_by_valid_token_returns_email_empresa_and_rol(): void
    {
        [, $rawToken] = $this->crearInvitacion();

        $this->getJson("/api/v1/invitaciones/{$rawToken}")
            ->assertOk()
            ->assertJsonPath('data.email', 'invitado@example.com')
            ->assertJsonPath('data.empresa', 'Empresa A')
            ->assertJsonPath('data.rol', 'Bodeguero');
    }

    public function test_get_invitation_by_unknown_token_fails(): void
    {
        $this->getJson('/api/v1/invitaciones/token-que-no-existe')
            ->assertStatus(422);
    }

    public function test_get_invitation_by_expired_token_fails(): void
    {
        [, $rawToken] = $this->crearInvitacion(['expires_at' => now()->subDay()]);

        $this->getJson("/api/v1/invitaciones/{$rawToken}")
            ->assertStatus(422);
    }

    public function test_get_invitation_by_already_accepted_token_fails(): void
    {
        [, $rawToken] = $this->crearInvitacion(['accepted_at' => now()]);

        $this->getJson("/api/v1/invitaciones/{$rawToken}")
            ->assertStatus(422);
    }

    public function test_accepting_a_valid_invitation_creates_a_verified_user_with_the_assigned_role(): void
    {
        [$invitacion, $rawToken] = $this->crearInvitacion();

        $this->postJson("/api/v1/invitaciones/{$rawToken}/aceptar", [
            'name' => 'Usuario Invitado',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $usuario = User::where('email', 'invitado@example.com')->first();
        $this->assertNotNull($usuario);
        $this->assertNotNull($usuario->email_verified_at);
        $this->assertTrue($usuario->hasVerifiedEmail());
        $this->assertSame($this->empresaA->id, $usuario->empresa_id);
        $this->assertTrue($usuario->hasRole('Bodeguero'));
        $this->assertSame($this->adminA->id, $usuario->invited_by);

        $this->assertNotNull($invitacion->fresh()->accepted_at);
    }

    public function test_a_newly_accepted_invited_user_can_actually_log_in(): void
    {
        [, $rawToken] = $this->crearInvitacion(['email' => 'puedeloguear@example.com']);

        $this->postJson("/api/v1/invitaciones/{$rawToken}/aceptar", [
            'name' => 'Usuario Invitado',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'puedeloguear@example.com',
            'password' => 'password123',
        ])->assertOk();
    }

    public function test_accepting_without_a_role_creates_a_user_without_any_role(): void
    {
        [, $rawToken] = $this->crearInvitacion(['role_id' => null]);

        $this->postJson("/api/v1/invitaciones/{$rawToken}/aceptar", [
            'name' => 'Usuario Invitado',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();

        $usuario = User::where('email', 'invitado@example.com')->first();
        $this->assertCount(0, $usuario->getRoleNames());
    }

    public function test_accepting_an_expired_invitation_fails_and_never_creates_a_user(): void
    {
        [, $rawToken] = $this->crearInvitacion(['expires_at' => now()->subDay()]);

        $this->postJson("/api/v1/invitaciones/{$rawToken}/aceptar", [
            'name' => 'Usuario Invitado',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'invitado@example.com']);
    }

    public function test_accepting_an_already_accepted_invitation_fails(): void
    {
        [, $rawToken] = $this->crearInvitacion(['accepted_at' => now()]);

        $this->postJson("/api/v1/invitaciones/{$rawToken}/aceptar", [
            'name' => 'Usuario Invitado',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422);
    }

    public function test_accepting_requires_matching_password_confirmation(): void
    {
        [, $rawToken] = $this->crearInvitacion();

        $this->postJson("/api/v1/invitaciones/{$rawToken}/aceptar", [
            'name' => 'Usuario Invitado',
            'password' => 'password123',
            'password_confirmation' => 'no-coincide',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'invitado@example.com']);
    }

    public function test_there_is_no_get_or_delete_endpoint_for_invitations_as_a_generic_resource(): void
    {
        $this->actingAs($this->adminA, 'api')
            ->getJson('/api/v1/usuarios/invitar')
            ->assertStatus(405);
    }
}
