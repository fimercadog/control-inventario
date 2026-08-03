<?php

namespace Tests\Feature;

use App\Models\AuthSession;
use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md). Alcance confirmado
 * explícitamente por el propietario del proyecto: Listar/Ver/Activar/
 * Desactivar únicamente. Un usuario nunca puede desactivar su propia
 * cuenta ni al último usuario de su empresa con `usuarios.editar`; no
 * existe ningún endpoint de crear ni de eliminar.
 */
class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $adminA;

    private User $userB;

    private Role $roleConGestion;

    private Role $roleAlterno;

    private Role $roleEmpresaB;

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
        $this->roleConGestion = Role::create(['name' => 'Administrador', 'guard_name' => 'api']);
        $this->roleConGestion->givePermissionTo('usuarios.editar', 'usuarios.ver');
        $this->roleAlterno = Role::create(['name' => 'Bodeguero', 'guard_name' => 'api']);

        $this->adminA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->adminA->assignRole($this->roleConGestion);

        $this->userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);

        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaB->id);
        $registrar->setPermissionsTeamId($this->empresaB->id);
        $this->roleEmpresaB = Role::create(['name' => 'Rol de Empresa B', 'guard_name' => 'api']);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
    }

    public function test_a_user_can_list_their_own_companys_users(): void
    {
        User::factory()->count(2)->create(['empresa_id' => $this->empresaA->id]);
        User::factory()->count(3)->create(['empresa_id' => $this->empresaB->id]);

        $this->actingAs($this->adminA, 'api')
            ->getJson('/api/v1/usuarios')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 3);
    }

    public function test_search_filters_by_name_or_email(): void
    {
        User::factory()->create(['empresa_id' => $this->empresaA->id, 'name' => 'Carlos Ramírez', 'email' => 'carlos@empresa-a.test']);
        User::factory()->create(['empresa_id' => $this->empresaA->id, 'name' => 'Ana Gómez', 'email' => 'ana@empresa-a.test']);

        $this->actingAs($this->adminA, 'api')
            ->getJson('/api/v1/usuarios?busqueda=Carlos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);

        $this->actingAs($this->adminA, 'api')
            ->getJson('/api/v1/usuarios?busqueda=ana@empresa-a.test')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_estado_filter_defaults_to_active_only(): void
    {
        $inactivo = User::factory()->create(['empresa_id' => $this->empresaA->id, 'is_active' => false]);

        $this->actingAs($this->adminA, 'api')
            ->getJson('/api/v1/usuarios')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1); // solo adminA, activo

        $this->actingAs($this->adminA, 'api')
            ->getJson('/api/v1/usuarios?estado=todos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 2);

        $this->actingAs($this->adminA, 'api')
            ->getJson('/api/v1/usuarios?estado=inactivo')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.id', $inactivo->id);
    }

    public function test_rol_filter_returns_only_users_with_that_role(): void
    {
        $vendedor = Role::create(['name' => 'Vendedor', 'guard_name' => 'api']);
        $userConRol = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $userConRol->assignRole($vendedor);

        $this->actingAs($this->adminA, 'api')
            ->getJson('/api/v1/usuarios?rol=Vendedor')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.id', $userConRol->id);
    }

    public function test_a_user_can_view_a_colleagues_detail_including_role(): void
    {
        $this->actingAs($this->adminA, 'api')
            ->getJson("/api/v1/usuarios/{$this->adminA->id}")
            ->assertOk()
            ->assertJsonPath('data.role', 'Administrador')
            ->assertJsonPath('data.is_active', true);
    }

    public function test_activating_a_user_persists_and_writes_audit(): void
    {
        $inactivo = User::factory()->create(['empresa_id' => $this->empresaA->id, 'is_active' => false]);

        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$inactivo->id}/activar")
            ->assertOk()
            ->assertJsonPath('data.is_active', true);

        $this->assertTrue($inactivo->fresh()->is_active);
        $this->assertDatabaseHas('audit_logs', [
            'modulo' => 'usuarios',
            'accion' => 'usuarios.activar',
            'auditable_id' => $inactivo->id,
        ]);
    }

    public function test_deactivating_a_colleague_persists_writes_audit_and_revokes_sessions(): void
    {
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        AuthSession::create([
            'user_id' => $colega->id,
            'refresh_token_hash' => hash('sha256', 'token-de-prueba'),
            'remember_me' => false,
            'last_used_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/desactivar")
            ->assertOk()
            ->assertJsonPath('data.is_active', false);

        $this->assertFalse($colega->fresh()->is_active);
        $this->assertDatabaseHas('audit_logs', [
            'modulo' => 'usuarios',
            'accion' => 'usuarios.desactivar',
            'auditable_id' => $colega->id,
        ]);
        $this->assertNotNull(AuthSession::where('user_id', $colega->id)->first()->revoked_at);
    }

    public function test_a_user_cannot_deactivate_their_own_account(): void
    {
        // Segundo admin para que la regla del último administrador no
        // interfiera con esta prueba — aislamos exclusivamente la regla
        // de auto-desactivación.
        $segundoAdmin = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $segundoAdmin->assignRole($this->roleConGestion);

        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$this->adminA->id}/desactivar")
            ->assertStatus(409);

        $this->assertTrue($this->adminA->fresh()->is_active);
    }

    public function test_the_last_user_with_gestion_permission_cannot_be_deactivated(): void
    {
        // adminA es el único usuario con usuarios.editar en Empresa A. Sin
        // enforcement granular por permiso todavía (fuera de alcance, ver
        // Users.md), cualquier usuario autenticado de la misma empresa
        // puede intentar la acción — la guarda de negocio debe bloquearla
        // igual, sin importar quién la dispare.
        $otroSinGestion = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $this->actingAs($otroSinGestion, 'api')
            ->postJson("/api/v1/usuarios/{$this->adminA->id}/desactivar")
            ->assertStatus(409);

        $this->assertTrue($this->adminA->fresh()->is_active);
    }

    public function test_deactivating_is_allowed_when_another_manager_remains(): void
    {
        $segundoAdmin = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $segundoAdmin->assignRole($this->roleConGestion);

        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$segundoAdmin->id}/desactivar")
            ->assertOk();

        $this->assertFalse($segundoAdmin->fresh()->is_active);
        // adminA sigue activo y sigue siendo el último con gestión — la
        // empresa nunca se quedó sin nadie que pueda gestionar usuarios.
        $this->assertTrue($this->adminA->fresh()->is_active);
    }

    public function test_a_platform_admin_never_appears_in_a_companys_listing(): void
    {
        User::factory()->create(['empresa_id' => null, 'is_platform_admin' => true]);

        $this->actingAs($this->adminA, 'api')
            ->getJson('/api/v1/usuarios')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_a_user_with_usuarios_editar_can_assign_a_role(): void
    {
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $colega->assignRole($this->roleAlterno);

        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/rol", ['role_id' => $this->roleConGestion->id])
            ->assertOk()
            ->assertJsonPath('data.role', 'Administrador');

        $this->assertTrue($colega->fresh()->hasRole('Administrador'));
    }

    public function test_assigning_a_role_replaces_the_previous_one_not_adds_to_it(): void
    {
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $colega->assignRole($this->roleAlterno);

        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/rol", ['role_id' => $this->roleConGestion->id])
            ->assertOk();

        $roles = $colega->fresh()->getRoleNames();
        $this->assertCount(1, $roles);
        $this->assertSame('Administrador', $roles->first());
    }

    public function test_assigning_a_role_from_another_company_fails_validation(): void
    {
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/rol", ['role_id' => $this->roleEmpresaB->id])
            ->assertStatus(422);

        $this->assertFalse($colega->fresh()->hasRole('Rol de Empresa B'));
    }

    /**
     * `UserPolicy::update()` (que gatea activar/desactivar/asignarRol por
     * igual) solo verifica pertenencia de empresa, nunca un permiso
     * Spatie real — estado documentado explícitamente en Users.md
     * ("enforcement granular por nombre de permiso todavía no
     * implementado, depende de Módulo 3, sin construir"), verdadero para
     * las tres acciones por igual, no una laguna nueva de `asignarRol()`.
     * Este test fija ese comportamiento actual, no lo aprueba como
     * destino final.
     */
    public function test_assigning_a_role_only_requires_company_membership_today_not_usuarios_editar(): void
    {
        $sinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $this->actingAs($sinPermiso, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/rol", ['role_id' => $this->roleConGestion->id])
            ->assertOk();
    }

    public function test_company_b_cannot_assign_a_role_to_company_as_user(): void
    {
        // role_id debe existir en la propia empresa del actor (empresaB)
        // para que la validación del FormRequest no dispare un 422 antes
        // de llegar al controller — lo que este test aísla es el 404 de
        // "el usuario destino no es de mi empresa", no la validación del rol.
        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/usuarios/{$this->adminA->id}/rol", ['role_id' => $this->roleEmpresaB->id])
            ->assertNotFound();
    }

    public function test_there_is_no_create_or_delete_endpoint_for_users(): void
    {
        $this->actingAs($this->adminA, 'api')
            ->postJson('/api/v1/usuarios', ['name' => 'Nuevo', 'email' => 'nuevo@test.com'])
            ->assertStatus(405);

        $this->actingAs($this->adminA, 'api')
            ->deleteJson("/api/v1/usuarios/{$this->adminA->id}")
            ->assertStatus(405);
    }

    public function test_company_b_cannot_view_activate_or_deactivate_company_as_user(): void
    {
        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/usuarios/{$this->adminA->id}")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/usuarios/{$this->adminA->id}/desactivar")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->getJson('/api/v1/usuarios')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1); // solo userB, nunca adminA
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/usuarios')->assertUnauthorized();
    }
}
