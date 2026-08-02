<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Módulo Clientes (2026-08-02). Borrado siempre lógico (GLOBAL RULE,
 * sesión 2026-07-29) — nunca un DELETE físico. Mismo shape de tests que
 * ProveedorControllerTest — Clientes sigue exactamente el mismo patrón de
 * autorización (pertenencia de empresa Y permiso) que el resto del ERP
 * desde el primer commit, sin la fase de transición que tuvieron los
 * módulos anteriores.
 */
class ClienteControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private User $userSinPermiso;

    private Cliente $clienteA;

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
        $context = app(TenantContext::class);
        $permisos = ['clientes.ver', 'clientes.crear', 'clientes.editar', 'clientes.gestionar'];

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Clientes A', 'guard_name' => 'api']);
        $rolA->givePermissionTo($permisos);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaB->id);
        $registrar->setPermissionsTeamId($this->empresaB->id);
        $rolB = Role::create(['name' => 'Test Clientes B', 'guard_name' => 'api']);
        $rolB->givePermissionTo($permisos);
        $this->userB->assignRole($rolB);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
        $this->clienteA = Cliente::create(['nombre' => 'Distribuidora Central', 'nit' => '900123456']);
    }

    public function test_a_user_can_create_a_client(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/clientes', [
                'nombre' => 'Cliente Nuevo SAS',
                'nit' => '900999999',
                'contacto' => 'Juan Pérez',
                'telefono' => '3001234567',
                'email' => 'contacto@clientenuevo.com',
                'ciudad' => 'Bogotá',
                'pais' => 'Colombia',
            ])
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'Cliente Nuevo SAS')
            ->assertJsonPath('data.estado', 'activo');

        $this->assertDatabaseHas('clientes', ['nombre' => 'Cliente Nuevo SAS', 'empresa_id' => $this->empresaA->id]);
    }

    public function test_creating_a_client_writes_a_real_audit_log_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/clientes', ['nombre' => 'Cliente Auditado']);

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'modulo' => 'clientes',
            'accion' => 'clientes.crear',
            'auditable_id' => $response->json('data.id'),
        ]);
    }

    public function test_a_user_can_view_and_list_their_own_companys_clients(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/clientes/{$this->clienteA->id}")
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Distribuidora Central');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/clientes')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_search_filters_by_nombre_nit_contacto_or_email(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        Cliente::create(['nombre' => 'Otro Distinto', 'nit' => '111']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/clientes?busqueda=Central')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.nombre', 'Distribuidora Central');
    }

    public function test_updating_a_client_persists_and_writes_audit(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/clientes/{$this->clienteA->id}", ['telefono' => '3009999999'])
            ->assertOk()
            ->assertJsonPath('data.telefono', '3009999999');

        $this->assertSame('3009999999', $this->clienteA->fresh()->telefono);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'clientes', 'accion' => 'clientes.editar']);
    }

    /**
     * Un campo `nullable` enviado explícitamente como `null` debe vaciarse
     * de verdad — no quedarse igual. Prueba directa de que `ClienteDTO` no
     * colapsa "campo no enviado" con "campo enviado como null" (ver el
     * comentario del propio DTO).
     */
    public function test_explicitly_clearing_a_nullable_field_persists_as_null(): void
    {
        $this->clienteA->update(['notas' => 'Nota original']);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/clientes/{$this->clienteA->id}", ['notas' => null])
            ->assertOk()
            ->assertJsonPath('data.notas', null);

        $this->assertNull($this->clienteA->fresh()->notas);
    }

    public function test_disabling_a_client_is_logical_never_physical(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/clientes/{$this->clienteA->id}/deshabilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');

        // La fila sigue existiendo — nunca un DELETE físico.
        $this->assertDatabaseHas('clientes', ['id' => $this->clienteA->id, 'estado' => 'inactivo']);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'clientes', 'accion' => 'clientes.deshabilitar']);
    }

    public function test_disabled_client_is_hidden_from_default_listing_but_visible_via_filter(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/clientes/{$this->clienteA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/clientes')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/clientes?estado=todos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_a_disabled_client_can_be_re_enabled(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/clientes/{$this->clienteA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/clientes/{$this->clienteA->id}/habilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');
    }

    public function test_pagination_works_with_a_real_page_param(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        Cliente::factory()->count(25)->create(['empresa_id' => $this->empresaA->id]);

        $primera = $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/clientes')
            ->assertOk()
            ->assertJsonPath('data.meta.current_page', 1);

        $this->assertSame(20, $primera->json('data.meta.per_page'));
        $this->assertGreaterThan(1, $primera->json('data.meta.last_page'));

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/clientes?page=2')
            ->assertOk()
            ->assertJsonPath('data.meta.current_page', 2);
    }

    public function test_company_b_cannot_view_update_or_disable_company_as_client(): void
    {
        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/clientes/{$this->clienteA->id}")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/clientes/{$this->clienteA->id}", ['nombre' => 'Hackeado'])
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/clientes/{$this->clienteA->id}/deshabilitar")
            ->assertNotFound();

        $this->assertNotSame('Hackeado', $this->clienteA->fresh()->nombre);
        $this->assertSame('activo', $this->clienteA->fresh()->estado);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/clientes')->assertUnauthorized();
    }

    public function test_a_same_company_user_without_permission_is_rejected_with_403(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/clientes')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/clientes/{$this->clienteA->id}")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson('/api/v1/clientes', ['nombre' => 'Sin permiso'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/clientes/{$this->clienteA->id}", ['nombre' => 'Hackeado'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/clientes/{$this->clienteA->id}/deshabilitar")
            ->assertStatus(403);

        $this->assertDatabaseMissing('clientes', ['nombre' => 'Sin permiso']);
        $this->assertNotSame('Hackeado', $this->clienteA->fresh()->nombre);
        $this->assertSame('activo', $this->clienteA->fresh()->estado);
    }
}
