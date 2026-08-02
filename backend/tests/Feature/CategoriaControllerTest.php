<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * RC1 (docs/03_FUNCTIONAL_SPEC/Categories.md). Borrado siempre lógico
 * (GLOBAL RULE, sesión 2026-07-29) — nunca un DELETE físico. Mismo shape
 * de tests que ProveedorControllerTest.
 *
 * Fase 4.5 (Authorization Alignment, docs/security/ROLES_MATRIX.md):
 * `userA` tiene las 4 categorias.* — cubre los casos ya existentes de
 * "usuario autorizado". `userSinPermiso` es de la MISMA empresa que
 * `categoriaA` pero sin ningún permiso — prueba el caso 403. `userB` sigue
 * probando aislamiento multi-tenant (404, ni siquiera llega a evaluar el
 * permiso — TenantScope ya lo bloquea antes).
 */
class CategoriaControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private User $userSinPermiso;

    private Categoria $categoriaA;

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
        $rol = Role::create(['name' => 'Test Categorias', 'guard_name' => 'api']);
        $rol->givePermissionTo(['categorias.ver', 'categorias.crear', 'categorias.editar', 'categorias.gestionar']);
        $this->userA->assignRole($rol);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->categoriaA = Categoria::create(['nombre' => 'Alimentos', 'descripcion' => 'Comida para mascotas']);
    }

    public function test_a_user_can_create_a_category(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/categorias', [
                'nombre' => 'Higiene y cuidado',
                'descripcion' => 'Shampoos, cepillos, etc.',
            ])
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'Higiene y cuidado')
            ->assertJsonPath('data.estado', 'activo');

        $this->assertDatabaseHas('categorias', ['nombre' => 'Higiene y cuidado', 'empresa_id' => $this->empresaA->id]);
    }

    public function test_creating_a_category_writes_a_real_audit_log_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/categorias', ['nombre' => 'Categoría Auditada']);

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'modulo' => 'categorias',
            'accion' => 'categorias.crear',
            'auditable_id' => $response->json('data.id'),
        ]);
    }

    public function test_a_user_can_view_and_list_their_own_companys_categories(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/categorias/{$this->categoriaA->id}")
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Alimentos');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/categorias')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_search_filters_by_nombre_or_descripcion(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        Categoria::create(['nombre' => 'Otra Distinta']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/categorias?busqueda=Alimentos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.nombre', 'Alimentos');
    }

    public function test_updating_a_category_persists_and_writes_audit(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/categorias/{$this->categoriaA->id}", ['descripcion' => 'Nueva descripción'])
            ->assertOk()
            ->assertJsonPath('data.descripcion', 'Nueva descripción');

        $this->assertSame('Nueva descripción', $this->categoriaA->fresh()->descripcion);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'categorias', 'accion' => 'categorias.editar']);
    }

    public function test_disabling_a_category_is_logical_never_physical(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/categorias/{$this->categoriaA->id}/deshabilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');

        // La fila sigue existiendo — nunca un DELETE físico.
        $this->assertDatabaseHas('categorias', ['id' => $this->categoriaA->id, 'estado' => 'inactivo']);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'categorias', 'accion' => 'categorias.deshabilitar']);
    }

    public function test_disabled_category_is_hidden_from_default_listing_but_visible_via_filter(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/categorias/{$this->categoriaA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/categorias')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/categorias?estado=todos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_a_disabled_category_can_be_re_enabled(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/categorias/{$this->categoriaA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/categorias/{$this->categoriaA->id}/habilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');
    }

    public function test_disabling_a_category_never_breaks_referential_integrity_with_products(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $producto = \App\Models\Producto::create([
            'categoria_id' => $this->categoriaA->id,
            'codigo' => 'P-001',
            'nombre' => 'Producto con categoría',
        ]);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/categorias/{$this->categoriaA->id}/deshabilitar")
            ->assertOk();

        // El producto sigue apuntando a la misma categoría — nunca se rompe
        // la relación ni se pone en null por deshabilitar la categoría.
        $this->assertSame($this->categoriaA->id, $producto->fresh()->categoria_id);
    }

    public function test_category_exposes_its_products_count_and_products_tab(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        \App\Models\Producto::create(['categoria_id' => $this->categoriaA->id, 'codigo' => 'P-002', 'nombre' => 'Producto A']);
        \App\Models\Producto::create(['categoria_id' => $this->categoriaA->id, 'codigo' => 'P-003', 'nombre' => 'Producto B']);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/categorias/{$this->categoriaA->id}")
            ->assertOk()
            ->assertJsonPath('data.productos_count', 2);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/categorias/{$this->categoriaA->id}/productos")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_company_b_cannot_view_update_or_disable_company_as_category(): void
    {
        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/categorias/{$this->categoriaA->id}")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/categorias/{$this->categoriaA->id}", ['nombre' => 'Hackeado'])
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/categorias/{$this->categoriaA->id}/deshabilitar")
            ->assertNotFound();

        $this->assertNotSame('Hackeado', $this->categoriaA->fresh()->nombre);
        $this->assertSame('activo', $this->categoriaA->fresh()->estado);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/categorias')->assertUnauthorized();
    }

    public function test_a_same_company_user_without_permission_is_rejected_with_403(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/categorias')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/categorias/{$this->categoriaA->id}")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson('/api/v1/categorias', ['nombre' => 'Sin permiso'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/categorias/{$this->categoriaA->id}", ['nombre' => 'Hackeado'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/categorias/{$this->categoriaA->id}/deshabilitar")
            ->assertStatus(403);

        $this->assertDatabaseMissing('categorias', ['nombre' => 'Sin permiso']);
        $this->assertNotSame('Hackeado', $this->categoriaA->fresh()->nombre);
        $this->assertSame('activo', $this->categoriaA->fresh()->estado);
    }
}
