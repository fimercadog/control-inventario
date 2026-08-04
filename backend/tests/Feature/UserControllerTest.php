<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\AuthSession;
use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

        Storage::fake('public');

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

    /**
     * Antes de 2026-08-04 este test verificaba que un tercero SIN permiso
     * podía disparar la guarda de "último administrador" (409). Desde que
     * `UserPolicy::update()` exige `usuarios.editar` en el actor
     * (auditoría de campos editables), ese escenario ya no es alcanzable:
     * cualquier actor que llegue a `desactivar()` ya tiene el permiso, así
     * que siempre queda como "otro con gestión" tras desactivar a alguien
     * más — la guarda nunca se dispara por un tercero. Lo que sí sigue
     * siendo cierto, y es lo que este test verifica ahora, es que un
     * segundo administrador SIEMPRE puede desactivar al primero sin que la
     * guarda interfiera (la empresa nunca se queda sin nadie con gestión,
     * porque el propio actor la conserva). El caso real que la guarda
     * todavía protege — la propia cuenta del último administrador — ya lo
     * cubre `test_a_user_cannot_deactivate_their_own_account` vía
     * `CannotDeactivateSelfException`, una guarda distinta y anterior en
     * el mismo método. Ver el docblock de `desactivar()` en
     * `UserController` para el razonamiento completo.
     */
    public function test_a_second_admin_can_deactivate_the_first_without_the_last_admin_guard_interfering(): void
    {
        $segundoAdmin = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $segundoAdmin->assignRole($this->roleConGestion);

        $this->actingAs($segundoAdmin, 'api')
            ->postJson("/api/v1/usuarios/{$this->adminA->id}/desactivar")
            ->assertOk();

        $this->assertFalse($this->adminA->fresh()->is_active);
        $this->assertTrue($segundoAdmin->fresh()->is_active);
    }

    /**
     * Cierre de la brecha documentada en `test_assigning_a_role_...` de
     * abajo y en `UserPolicy::update()` — activar/desactivar/asignarRol
     * ahora exigen `usuarios.editar`, no solo pertenencia de empresa
     * (auditoría de campos editables, 2026-08-04).
     */
    public function test_a_user_without_usuarios_editar_cannot_deactivate_a_colleague(): void
    {
        $sinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $this->actingAs($sinPermiso, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/desactivar")
            ->assertStatus(403);

        $this->assertTrue($colega->fresh()->is_active);
    }

    public function test_a_user_without_usuarios_editar_cannot_activate_a_colleague(): void
    {
        $sinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id, 'is_active' => false]);

        $this->actingAs($sinPermiso, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/activar")
            ->assertStatus(403);

        $this->assertFalse($colega->fresh()->is_active);
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
     * igual) solo verificaba pertenencia de empresa hasta 2026-08-04 —
     * brecha documentada en Users.md como dependiente del Módulo 3
     * (Authorization/RBAC). Módulo 3 se completó 2026-08-02; esta laguna
     * se cerró en la auditoría de campos editables. Reemplaza al test
     * anterior que fijaba el comportamiento permisivo como "actual, no
     * destino final" — este es ahora el destino final.
     */
    public function test_assigning_a_role_requires_usuarios_editar_permission(): void
    {
        $sinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $this->actingAs($sinPermiso, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/rol", ['role_id' => $this->roleConGestion->id])
            ->assertStatus(403);

        $this->assertFalse($colega->fresh()->hasRole('Administrador'));
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

    /**
     * ADR-015 (modelo de identidad ERP, 2026-08-04): un administrador con
     * `usuarios.editar` puede editar los campos Operational de OTRO
     * usuario de su empresa — reversión deliberada de la regla anterior
     * "ningún usuario edita el perfil de otro, estructuralmente
     * imposible" (`docs/03_FUNCTIONAL_SPEC/Profile.md`).
     */
    public function test_a_user_with_usuarios_editar_can_update_a_colleagues_operational_fields(): void
    {
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id, 'theme' => 'system']);

        $this->actingAs($this->adminA, 'api')
            ->patchJson("/api/v1/usuarios/{$colega->id}", [
                'theme' => 'dark',
                'language' => 'en',
                'timezone' => 'America/Mexico_City',
            ])
            ->assertOk()
            ->assertJsonPath('data.theme', 'dark')
            ->assertJsonPath('data.language', 'en')
            ->assertJsonPath('data.timezone', 'America/Mexico_City');

        $this->assertSame('dark', $colega->fresh()->theme);

        $log = AuditLog::where('modulo', 'usuarios')->where('accion', 'usuarios.editar')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertSame('dark', $log->valores_nuevos['theme'] ?? null);
    }

    /** `name`/`email` son Identity — nunca aceptados por este endpoint, ni siquiera por un administrador. */
    public function test_name_and_email_cannot_be_changed_via_the_update_endpoint(): void
    {
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id, 'name' => 'Nombre Original']);
        $emailOriginal = $colega->email;

        $this->actingAs($this->adminA, 'api')
            ->patchJson("/api/v1/usuarios/{$colega->id}", [
                'name' => 'Nombre Hackeado',
                'email' => 'hackeado@test.com',
                'theme' => 'dark',
            ])
            ->assertOk();

        $this->assertSame('Nombre Original', $colega->fresh()->name);
        $this->assertSame($emailOriginal, $colega->fresh()->email);
        $this->assertSame('dark', $colega->fresh()->theme);
    }

    public function test_a_user_without_usuarios_editar_cannot_update_a_colleague(): void
    {
        $sinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id, 'theme' => 'system']);

        $this->actingAs($sinPermiso, 'api')
            ->patchJson("/api/v1/usuarios/{$colega->id}", ['theme' => 'dark'])
            ->assertStatus(403);

        $this->assertSame('system', $colega->fresh()->theme);
    }

    public function test_company_b_cannot_update_company_as_user(): void
    {
        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/usuarios/{$this->adminA->id}", ['theme' => 'dark'])
            ->assertNotFound();
    }

    public function test_show_exposes_empresa_and_is_platform_admin_as_identity_fields(): void
    {
        $this->actingAs($this->adminA, 'api')
            ->getJson("/api/v1/usuarios/{$this->adminA->id}")
            ->assertOk()
            ->assertJsonPath('data.empresa.nombre', 'Empresa A')
            ->assertJsonPath('data.is_platform_admin', false);
    }

    public function test_an_admin_can_upload_a_colleagues_avatar(): void
    {
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $archivo = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/avatar", ['avatar' => $archivo]);

        $response->assertOk();
        $colega->refresh();
        $this->assertNotNull($colega->avatar_path);
        Storage::disk('public')->assertExists($colega->avatar_path);
        $this->assertStringContainsString('/storage/', $response->json('data.avatar_url'));
    }

    public function test_uploading_a_new_avatar_for_a_colleague_deletes_the_old_one(): void
    {
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/avatar", ['avatar' => UploadedFile::fake()->create('primero.jpg', 100, 'image/jpeg')]);
        $primeraRuta = $colega->refresh()->avatar_path;

        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/avatar", ['avatar' => UploadedFile::fake()->create('segundo.jpg', 100, 'image/jpeg')]);

        Storage::disk('public')->assertMissing($primeraRuta);
        Storage::disk('public')->assertExists($colega->refresh()->avatar_path);
    }

    public function test_an_admin_can_remove_a_colleagues_avatar(): void
    {
        $colega = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->actingAs($this->adminA, 'api')
            ->postJson("/api/v1/usuarios/{$colega->id}/avatar", ['avatar' => UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg')]);
        $ruta = $colega->refresh()->avatar_path;

        $this->actingAs($this->adminA, 'api')
            ->deleteJson("/api/v1/usuarios/{$colega->id}/avatar")
            ->assertOk()
            ->assertJsonPath('data.avatar_url', null);

        Storage::disk('public')->assertMissing($ruta);
        $this->assertNull($colega->fresh()->avatar_path);
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
