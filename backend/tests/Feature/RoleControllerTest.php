<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md).
 * Desactivación siempre lógica (GLOBAL RULE, sesión 2026-07-29) — nunca un
 * DELETE físico. A diferencia del resto del ERP, solo 2 permisos
 * (`roles.ver`/`roles.gestionar`, ya documentados así antes de este
 * código) — `userA` recibe ambos, `userSinPermiso` ninguno.
 */
class RoleControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private User $userSinPermiso;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $registrar = app(PermissionRegistrar::class);
        $permisos = ['roles.ver', 'roles.gestionar'];

        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolAuthA = Role::create(['name' => 'Test Auth A', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolAuthA->givePermissionTo($permisos);
        $this->userA->assignRole($rolAuthA);
        $registrar->forgetCachedPermissions();

        $registrar->setPermissionsTeamId($this->empresaB->id);
        $rolAuthB = Role::create(['name' => 'Test Auth B', 'guard_name' => 'api', 'empresa_id' => $this->empresaB->id]);
        $rolAuthB->givePermissionTo($permisos);
        $this->userB->assignRole($rolAuthB);
        $registrar->forgetCachedPermissions();

        $registrar->setPermissionsTeamId($this->empresaA->id);
    }

    public function test_a_user_can_create_a_role(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/roles', ['name' => 'Supervisor de Bodega'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Supervisor de Bodega')
            ->assertJsonPath('data.estado', 'activo');

        $this->assertDatabaseHas('roles', ['name' => 'Supervisor de Bodega', 'empresa_id' => $this->empresaA->id]);
    }

    public function test_creating_a_role_writes_a_real_audit_log_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/roles', ['name' => 'Rol Auditado']);

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'modulo' => 'roles',
            'accion' => 'roles.crear',
            'auditable_id' => $response->json('data.id'),
        ]);
    }

    public function test_a_role_can_be_created_with_permissions_assigned(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/roles', [
                'name' => 'Rol Con Permisos',
                'permisos' => ['clientes.ver', 'clientes.crear'],
            ])
            ->assertCreated();

        $this->assertEqualsCanonicalizing(['clientes.ver', 'clientes.crear'], $response->json('data.permisos'));
    }

    public function test_creating_a_role_rejects_a_platform_reserved_permission(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/roles', [
                'name' => 'Rol Malicioso',
                'permisos' => ['plataforma.empresas.ver'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('permisos.0');

        $this->assertDatabaseMissing('roles', ['name' => 'Rol Malicioso']);
    }

    public function test_creating_a_role_rejects_a_nonexistent_permission(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/roles', [
                'name' => 'Rol Inventado',
                'permisos' => ['permiso.que.no.existe'],
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('permisos.0');
    }

    /**
     * Bug real encontrado en verificación de navegador: Spatie exige
     * unicidad de `(empresa_id, name, guard_name)` a nivel de base de
     * datos, y sin esta validación el segundo intento de crear el mismo
     * nombre lanzaba `RoleAlreadyExists` sin capturar — una excepción
     * cruda, violando "no raw exceptions". Corregido con una regla
     * `unique` en el FormRequest antes de llegar al Service/Repository.
     */
    public function test_creating_a_role_with_a_duplicate_name_returns_a_clean_validation_error(): void
    {
        $this->crearRole('Rol Duplicado');

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/roles', ['name' => 'Rol Duplicado'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('name')
            ->assertJsonMissingPath('exception');

        $this->assertDatabaseCount('roles', 3); // "Test Auth A" (setUp) + "Test Auth B" + el original, no un tercero
    }

    public function test_a_different_company_can_reuse_a_role_name_already_used_by_another_company(): void
    {
        $this->crearRole('Rol Compartido Por Nombre');

        $this->actingAs($this->userB, 'api')
            ->postJson('/api/v1/roles', ['name' => 'Rol Compartido Por Nombre'])
            ->assertCreated();
    }

    public function test_renaming_a_role_to_its_own_current_name_is_not_a_conflict(): void
    {
        $role = $this->crearRole('Rol Sin Cambios');

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/roles/{$role->id}", ['name' => 'Rol Sin Cambios', 'estado' => 'activo'])
            ->assertOk();
    }

    public function test_a_user_can_view_and_list_their_own_companys_roles(): void
    {
        $roleA = $this->crearRole('Ficha De Prueba');

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/roles/{$roleA->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Ficha De Prueba');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/roles')
            ->assertOk()
            ->assertJsonPath('data.meta.total', fn ($total) => $total >= 2); // incluye "Test Auth A" + esta
    }

    public function test_search_filters_by_name(): void
    {
        $this->crearRole('Compras Internacionales');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/roles?busqueda=Compras')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.name', 'Compras Internacionales');
    }

    public function test_updating_a_role_persists_and_writes_audit(): void
    {
        $role = $this->crearRole('Nombre Viejo');

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/roles/{$role->id}", ['name' => 'Nombre Nuevo'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Nombre Nuevo');

        $this->assertSame('Nombre Nuevo', $role->fresh()->name);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'roles', 'accion' => 'roles.editar']);
    }

    public function test_updating_a_roles_permissions_replaces_the_previous_set(): void
    {
        $role = $this->crearRole('Rol Cambiante', ['clientes.ver', 'clientes.crear']);

        $response = $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/roles/{$role->id}", ['permisos' => ['productos.ver']])
            ->assertOk();

        $this->assertSame(['productos.ver'], $response->json('data.permisos'));
        $this->assertTrue($role->fresh()->hasPermissionTo('productos.ver'));
        $this->assertFalse($role->fresh()->hasPermissionTo('clientes.ver'));
    }

    public function test_omitting_permisos_on_update_leaves_the_current_assignment_untouched(): void
    {
        $role = $this->crearRole('Rol Intacto', ['clientes.ver']);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/roles/{$role->id}", ['name' => 'Rol Intacto Renombrado'])
            ->assertOk();

        $this->assertTrue($role->fresh()->hasPermissionTo('clientes.ver'));
    }

    public function test_deactivating_a_role_is_logical_never_physical(): void
    {
        $role = $this->crearRole('Rol A Desactivar');

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/roles/{$role->id}/desactivar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');

        $this->assertDatabaseHas('roles', ['id' => $role->id, 'estado' => 'inactivo']);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'roles', 'accion' => 'roles.deshabilitar']);
    }

    public function test_a_role_with_assigned_users_cannot_be_deactivated(): void
    {
        $role = $this->crearRole('Rol Con Gente');
        $miembro = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $miembro->assignRole($role);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/roles/{$role->id}/desactivar")
            ->assertStatus(409);

        $this->assertSame('activo', $role->fresh()->estado);
    }

    public function test_deactivating_is_allowed_once_no_users_remain_assigned(): void
    {
        $role = $this->crearRole('Rol Temporalmente Ocupado');
        $miembro = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $miembro->assignRole($role);
        $miembro->removeRole($role);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/roles/{$role->id}/desactivar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');
    }

    public function test_disabled_role_is_hidden_from_default_listing_but_visible_via_filter(): void
    {
        $role = $this->crearRole('Rol Oculto');
        $this->actingAs($this->userA, 'api')->postJson("/api/v1/roles/{$role->id}/desactivar");

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/roles?busqueda=Rol Oculto')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/roles?busqueda=Rol Oculto&estado=todos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_a_disabled_role_can_be_reactivated(): void
    {
        $role = $this->crearRole('Rol Reactivable');
        $this->actingAs($this->userA, 'api')->postJson("/api/v1/roles/{$role->id}/desactivar");

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/roles/{$role->id}/activar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');
    }

    public function test_the_users_tab_lists_assigned_users(): void
    {
        $role = $this->crearRole('Rol Con Ficha De Usuarios');
        $miembro = User::factory()->create(['empresa_id' => $this->empresaA->id, 'name' => 'Ana Miembro']);
        $miembro->assignRole($role);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/roles/{$role->id}/usuarios")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Ana Miembro');
    }

    public function test_the_global_permission_catalog_endpoint_excludes_platform_namespace(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/permisos')
            ->assertOk();

        $this->assertContains('clientes.ver', $response->json('data'));
        $this->assertFalse(
            collect($response->json('data'))->contains(fn ($p) => str_starts_with($p, 'plataforma.')),
            'El catálogo expuesto para asignar a un rol de empresa nunca debe incluir el namespace plataforma.*'
        );
    }

    public function test_pagination_works_with_a_real_page_param(): void
    {
        for ($i = 0; $i < 25; $i++) {
            $this->crearRole("Rol Numerado {$i}");
        }

        $primera = $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/roles')
            ->assertOk()
            ->assertJsonPath('data.meta.current_page', 1);

        $this->assertGreaterThan(1, $primera->json('data.meta.last_page'));

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/roles?page=2')
            ->assertOk()
            ->assertJsonPath('data.meta.current_page', 2);
    }

    public function test_company_b_cannot_view_update_or_deactivate_company_as_role(): void
    {
        $role = $this->crearRole('Rol Privado De A');

        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/roles/{$role->id}")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/roles/{$role->id}", ['name' => 'Hackeado'])
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/roles/{$role->id}/desactivar")
            ->assertNotFound();

        $this->assertNotSame('Hackeado', $role->fresh()->name);
        $this->assertSame('activo', $role->fresh()->estado);
    }

    /**
     * Cierre de módulo (2026-08-11): el test de arriba cubre GET/PATCH/
     * desactivar cruzado pero no /activar — mismo endpoint, mismo
     * mecanismo (resolverParaEmpresaActual), sin cobertura dedicada hasta
     * ahora (mismo gap ya cerrado en Proveedores/Clientes/Usuarios).
     */
    public function test_company_b_cannot_activate_company_as_role(): void
    {
        $role = $this->crearRole('Rol Privado De A Para Activar');
        $this->actingAs($this->userA, 'api')->postJson("/api/v1/roles/{$role->id}/desactivar");

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/roles/{$role->id}/activar")
            ->assertNotFound();

        $this->assertSame('inactivo', $role->fresh()->estado);
    }

    /**
     * `empresa_id`/`id`/`guard_name` no están declarados en
     * `UpdateRoleRequest::rules()`, así que `$request->validated()` los
     * excluye siempre — ya seguro por construcción, pero nunca probado
     * con un payload real combinando los tres a la vez (mismo patrón de
     * cierre ya aplicado en Proveedores/Clientes/Usuarios).
     */
    public function test_privileged_fields_cannot_be_mass_assigned_via_the_generic_update_endpoint(): void
    {
        $role = $this->crearRole('Rol Para Ataque Mass Assignment');
        $idOriginal = $role->id;
        $guardOriginal = $role->guard_name;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/roles/{$role->id}", [
                'id' => 999999,
                'empresa_id' => $this->empresaB->id,
                'guard_name' => 'web',
                'name' => 'Rol Renombrado Legitimamente',
            ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Rol Renombrado Legitimamente');

        $fresco = $role->fresh();
        $this->assertSame($idOriginal, $fresco->id);
        $this->assertSame($this->empresaA->id, $fresco->empresa_id);
        $this->assertSame($guardOriginal, $fresco->guard_name);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/roles')->assertUnauthorized();
    }

    public function test_a_same_company_user_without_permission_is_rejected_with_403(): void
    {
        $role = $this->crearRole('Rol Protegido');

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/roles')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/roles/{$role->id}")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson('/api/v1/roles', ['name' => 'Sin permiso'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/roles/{$role->id}", ['name' => 'Hackeado'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/roles/{$role->id}/desactivar")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/permisos')
            ->assertStatus(403);

        $this->assertDatabaseMissing('roles', ['name' => 'Sin permiso']);
        $this->assertNotSame('Hackeado', $role->fresh()->name);
    }

    /**
     * Work Order "Roles: Exportación CSV y PDF". Gateado por `roles.ver`
     * (viewAny), no `reportes.ver` — mismo criterio ya aplicado en
     * Usuarios (ver el docblock de `RoleController::exportarCsv()`).
     */
    public function test_a_user_can_export_csv_with_real_data(): void
    {
        $this->crearRole('Rol Exportable', ['roles.ver']);

        $response = $this->actingAs($this->userA, 'api')->get('/api/v1/roles/export/csv');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('attachment', $response->headers->get('Content-Disposition'));

        $contenido = $response->streamedContent();
        $this->assertStringContainsString('Rol Exportable', $contenido);
        $this->assertStringContainsString('#,Nombre,Estado,Permisos,Usuarios', $contenido);
    }

    public function test_a_user_can_export_pdf(): void
    {
        $response = $this->actingAs($this->userA, 'api')->get('/api/v1/roles/export/pdf');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_csv_export_respects_the_current_search_filter(): void
    {
        $this->crearRole('Encontrable Export Uno');
        $this->crearRole('Otro Distinto Export');

        $contenido = $this->actingAs($this->userA, 'api')
            ->get('/api/v1/roles/export/csv?busqueda=Encontrable')
            ->streamedContent();

        $this->assertStringContainsString('Encontrable Export Uno', $contenido);
        $this->assertStringNotContainsString('Otro Distinto Export', $contenido);
    }

    public function test_csv_export_respects_the_current_estado_filter(): void
    {
        $inactivo = $this->crearRole('Rol Inactivo Export');
        $inactivo->update(['estado' => 'inactivo']);

        $activosContenido = $this->actingAs($this->userA, 'api')->get('/api/v1/roles/export/csv')->streamedContent();
        $this->assertStringNotContainsString('Rol Inactivo Export', $activosContenido);

        $todosContenido = $this->actingAs($this->userA, 'api')->get('/api/v1/roles/export/csv?estado=todos')->streamedContent();
        $this->assertStringContainsString('Rol Inactivo Export', $todosContenido);
    }

    public function test_csv_export_includes_the_full_filtered_set_not_just_one_page(): void
    {
        for ($i = 1; $i <= 25; $i++) {
            $this->crearRole("Rol Masivo Export {$i}");
        }

        // El listado real pagina de a 20 por defecto; la exportación debe
        // traer las 25 filas filtradas completas, no solo las primeras 20.
        $contenido = $this->actingAs($this->userA, 'api')
            ->get('/api/v1/roles/export/csv?busqueda=Rol Masivo Export')
            ->streamedContent();

        $filas = array_filter(explode("\n", trim($contenido)));
        $this->assertCount(26, $filas); // encabezado + 25 roles
    }

    public function test_export_never_includes_another_companys_roles(): void
    {
        $rolB = Role::create(['name' => 'Rol Exclusivo Empresa B', 'guard_name' => 'api', 'empresa_id' => $this->empresaB->id]);

        $contenido = $this->actingAs($this->userA, 'api')
            ->get('/api/v1/roles/export/csv')
            ->streamedContent();

        $this->assertStringNotContainsString('Rol Exclusivo Empresa B', $contenido);
    }

    public function test_a_user_without_roles_ver_cannot_export(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')->get('/api/v1/roles/export/csv')->assertStatus(403);
        $this->actingAs($this->userSinPermiso, 'api')->get('/api/v1/roles/export/pdf')->assertStatus(403);
    }

    public function test_export_endpoints_reject_unauthenticated_requests(): void
    {
        $this->getJson('/api/v1/roles/export/csv')->assertUnauthorized();
        $this->getJson('/api/v1/roles/export/pdf')->assertUnauthorized();
    }

    /**
     * @param array<int, string> $permisos
     */
    private function crearRole(string $name, array $permisos = []): Role
    {
        $role = Role::create(['name' => $name, 'guard_name' => 'api', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);
        if ($permisos !== []) {
            $role->givePermissionTo($permisos);
        }

        return $role;
    }
}
