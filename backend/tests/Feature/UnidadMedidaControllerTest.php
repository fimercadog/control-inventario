<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Role;
use App\Models\UnidadMedida;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * RC1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). Borrado siempre lógico
 * (GLOBAL RULE, sesión 2026-07-29) — nunca un DELETE físico. Mismo shape
 * de tests que CategoriaControllerTest/MarcaControllerTest.
 *
 * Fase 4.5 (Authorization Alignment): `userA` tiene las 4 unidades-medida.* —
 * cubre los casos de "usuario autorizado". `userSinPermiso` es de la
 * misma empresa pero sin permisos — prueba 403.
 */
class UnidadMedidaControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private User $userSinPermiso;

    private UnidadMedida $unidadA;

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
        $rol = Role::create(['name' => 'Test Unidades', 'guard_name' => 'api']);
        $rol->givePermissionTo(['unidades-medida.ver', 'unidades-medida.crear', 'unidades-medida.editar', 'unidades-medida.gestionar']);
        $this->userA->assignRole($rol);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->unidadA = UnidadMedida::create(['nombre' => 'Kilogramo', 'abreviatura' => 'kg']);
    }

    public function test_a_user_can_create_a_unit_of_measure(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/unidades-medida', ['nombre' => 'Litro', 'abreviatura' => 'L'])
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'Litro')
            ->assertJsonPath('data.abreviatura', 'L')
            ->assertJsonPath('data.estado', 'activo');

        $this->assertDatabaseHas('unidades_medida', ['nombre' => 'Litro', 'empresa_id' => $this->empresaA->id]);
    }

    public function test_creating_a_unit_of_measure_writes_a_real_audit_log_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/unidades-medida', ['nombre' => 'Unidad Auditada']);

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'modulo' => 'unidades-medida',
            'accion' => 'unidades-medida.crear',
            'auditable_id' => $response->json('data.id'),
        ]);
    }

    public function test_a_user_can_view_and_list_their_own_companys_units_of_measure(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/unidades-medida/{$this->unidadA->id}")
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Kilogramo');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/unidades-medida')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_search_filters_by_nombre_or_abreviatura(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        UnidadMedida::create(['nombre' => 'Otra Distinta', 'abreviatura' => 'od']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/unidades-medida?busqueda=Kilogramo')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.nombre', 'Kilogramo');
    }

    public function test_updating_a_unit_of_measure_persists_and_writes_audit(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/unidades-medida/{$this->unidadA->id}", ['abreviatura' => 'Kg.'])
            ->assertOk()
            ->assertJsonPath('data.abreviatura', 'Kg.');

        $this->assertSame('Kg.', $this->unidadA->fresh()->abreviatura);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'unidades-medida', 'accion' => 'unidades-medida.editar']);
    }

    public function test_disabling_a_unit_of_measure_is_logical_never_physical(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/unidades-medida/{$this->unidadA->id}/deshabilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');

        // La fila sigue existiendo — nunca un DELETE físico.
        $this->assertDatabaseHas('unidades_medida', ['id' => $this->unidadA->id, 'estado' => 'inactivo']);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'unidades-medida', 'accion' => 'unidades-medida.deshabilitar']);
    }

    public function test_disabled_unit_of_measure_is_hidden_from_default_listing_but_visible_via_filter(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/unidades-medida/{$this->unidadA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/unidades-medida')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/unidades-medida?estado=todos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_a_disabled_unit_of_measure_can_be_re_enabled(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/unidades-medida/{$this->unidadA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/unidades-medida/{$this->unidadA->id}/habilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');
    }

    public function test_disabling_a_unit_of_measure_never_breaks_referential_integrity_with_products(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $producto = \App\Models\Producto::create([
            'unidad_medida_id' => $this->unidadA->id,
            'codigo' => 'P-001',
            'nombre' => 'Producto con unidad',
        ]);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/unidades-medida/{$this->unidadA->id}/deshabilitar")
            ->assertOk();

        // El producto sigue apuntando a la misma unidad de medida — nunca
        // se rompe la relación ni se pone en null por deshabilitarla.
        $this->assertSame($this->unidadA->id, $producto->fresh()->unidad_medida_id);
    }

    public function test_unit_of_measure_exposes_its_products_count_and_products_tab(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        \App\Models\Producto::create(['unidad_medida_id' => $this->unidadA->id, 'codigo' => 'P-002', 'nombre' => 'Producto A']);
        \App\Models\Producto::create(['unidad_medida_id' => $this->unidadA->id, 'codigo' => 'P-003', 'nombre' => 'Producto B']);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/unidades-medida/{$this->unidadA->id}")
            ->assertOk()
            ->assertJsonPath('data.productos_count', 2);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/unidades-medida/{$this->unidadA->id}/productos")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_company_b_cannot_view_update_or_disable_company_as_unit_of_measure(): void
    {
        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/unidades-medida/{$this->unidadA->id}")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/unidades-medida/{$this->unidadA->id}", ['nombre' => 'Hackeado'])
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/unidades-medida/{$this->unidadA->id}/deshabilitar")
            ->assertNotFound();

        $this->assertNotSame('Hackeado', $this->unidadA->fresh()->nombre);
        $this->assertSame('activo', $this->unidadA->fresh()->estado);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/unidades-medida')->assertUnauthorized();
    }

    public function test_a_same_company_user_without_permission_is_rejected_with_403(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/unidades-medida')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/unidades-medida/{$this->unidadA->id}")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson('/api/v1/unidades-medida', ['nombre' => 'Sin permiso'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/unidades-medida/{$this->unidadA->id}", ['nombre' => 'Hackeado'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/unidades-medida/{$this->unidadA->id}/deshabilitar")
            ->assertStatus(403);

        $this->assertDatabaseMissing('unidades_medida', ['nombre' => 'Sin permiso']);
        $this->assertNotSame('Hackeado', $this->unidadA->fresh()->nombre);
        $this->assertSame('activo', $this->unidadA->fresh()->estado);
    }
}
