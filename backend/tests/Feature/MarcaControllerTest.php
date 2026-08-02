<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Marca;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * RC1 (docs/03_FUNCTIONAL_SPEC/Brands.md). Borrado siempre lógico
 * (GLOBAL RULE, sesión 2026-07-29) — nunca un DELETE físico. Mismo shape
 * de tests que CategoriaControllerTest.
 *
 * Fase 4.5 (Authorization Alignment): `userA` tiene las 4 marcas.* —
 * cubre los casos de "usuario autorizado". `userSinPermiso` es de la
 * misma empresa pero sin permisos — prueba 403.
 */
class MarcaControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private User $userSinPermiso;

    private Marca $marcaA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->empresaA->id);
        $rol = Role::create(['name' => 'Test Marcas', 'guard_name' => 'api']);
        $rol->givePermissionTo(['marcas.ver', 'marcas.crear', 'marcas.editar', 'marcas.gestionar']);
        $this->userA->assignRole($rol);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->marcaA = Marca::create(['nombre' => 'Royal Canin']);
    }

    public function test_a_user_can_create_a_brand(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/marcas', ['nombre' => 'Purina'])
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'Purina')
            ->assertJsonPath('data.estado', 'activo');

        $this->assertDatabaseHas('marcas', ['nombre' => 'Purina', 'empresa_id' => $this->empresaA->id]);
    }

    public function test_creating_a_brand_writes_a_real_audit_log_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/marcas', ['nombre' => 'Marca Auditada']);

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'modulo' => 'marcas',
            'accion' => 'marcas.crear',
            'auditable_id' => $response->json('data.id'),
        ]);
    }

    public function test_a_user_can_view_and_list_their_own_companys_brands(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/marcas/{$this->marcaA->id}")
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Royal Canin');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/marcas')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_search_filters_by_nombre(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        Marca::create(['nombre' => 'Otra Distinta']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/marcas?busqueda=Royal')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.nombre', 'Royal Canin');
    }

    public function test_updating_a_brand_persists_and_writes_audit(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/marcas/{$this->marcaA->id}", ['nombre' => 'Royal Canin Pro'])
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Royal Canin Pro');

        $this->assertSame('Royal Canin Pro', $this->marcaA->fresh()->nombre);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'marcas', 'accion' => 'marcas.editar']);
    }

    public function test_disabling_a_brand_is_logical_never_physical(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/marcas/{$this->marcaA->id}/deshabilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');

        // La fila sigue existiendo — nunca un DELETE físico.
        $this->assertDatabaseHas('marcas', ['id' => $this->marcaA->id, 'estado' => 'inactivo']);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'marcas', 'accion' => 'marcas.deshabilitar']);
    }

    public function test_disabled_brand_is_hidden_from_default_listing_but_visible_via_filter(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/marcas/{$this->marcaA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/marcas')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/marcas?estado=todos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_a_disabled_brand_can_be_re_enabled(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/marcas/{$this->marcaA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/marcas/{$this->marcaA->id}/habilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');
    }

    public function test_disabling_a_brand_never_breaks_referential_integrity_with_products(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $producto = \App\Models\Producto::create([
            'marca_id' => $this->marcaA->id,
            'codigo' => 'P-001',
            'nombre' => 'Producto con marca',
        ]);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/marcas/{$this->marcaA->id}/deshabilitar")
            ->assertOk();

        // El producto sigue apuntando a la misma marca — nunca se rompe
        // la relación ni se pone en null por deshabilitar la marca.
        $this->assertSame($this->marcaA->id, $producto->fresh()->marca_id);
    }

    public function test_brand_exposes_its_products_count_and_products_tab(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        \App\Models\Producto::create(['marca_id' => $this->marcaA->id, 'codigo' => 'P-002', 'nombre' => 'Producto A']);
        \App\Models\Producto::create(['marca_id' => $this->marcaA->id, 'codigo' => 'P-003', 'nombre' => 'Producto B']);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/marcas/{$this->marcaA->id}")
            ->assertOk()
            ->assertJsonPath('data.productos_count', 2);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/marcas/{$this->marcaA->id}/productos")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_company_b_cannot_view_update_or_disable_company_as_brand(): void
    {
        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/marcas/{$this->marcaA->id}")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/marcas/{$this->marcaA->id}", ['nombre' => 'Hackeado'])
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/marcas/{$this->marcaA->id}/deshabilitar")
            ->assertNotFound();

        $this->assertNotSame('Hackeado', $this->marcaA->fresh()->nombre);
        $this->assertSame('activo', $this->marcaA->fresh()->estado);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/marcas')->assertUnauthorized();
    }

    public function test_a_same_company_user_without_permission_is_rejected_with_403(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/marcas')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/marcas/{$this->marcaA->id}")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson('/api/v1/marcas', ['nombre' => 'Sin permiso'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/marcas/{$this->marcaA->id}", ['nombre' => 'Hackeado'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/marcas/{$this->marcaA->id}/deshabilitar")
            ->assertStatus(403);

        $this->assertDatabaseMissing('marcas', ['nombre' => 'Sin permiso']);
        $this->assertNotSame('Hackeado', $this->marcaA->fresh()->nombre);
        $this->assertSame('activo', $this->marcaA->fresh()->estado);
    }
}
