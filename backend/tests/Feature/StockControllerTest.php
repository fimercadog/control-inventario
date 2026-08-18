<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Producto;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * RC1 Fase 2 (docs/03_FUNCTIONAL_SPEC/Stock.md). Stock NO es una entidad
 * independiente — opera sobre Producto. Reglas confirmadas explícitamente
 * por el propietario del proyecto antes de esta unidad de trabajo: sin
 * `store()` (no existe "crear Stock"), `update()` solo toca umbrales
 * (`stock_minimo`/`stock_maximo`, nunca `stock_actual`), y
 * `disable()`/`enable()` solo tocan `stock_estado` — nunca `stock_actual`
 * ni `productos.estado`, nunca generan un movimiento.
 *
 * Fase 4.5 (Authorization Alignment): `userA` tiene `stock.ver/editar/
 * gestionar` (sin `stock.crear` — no existe esa acción). `userSinPermiso`
 * es de la misma empresa pero sin esos permisos — prueba 403, vía
 * `StockPolicy` (dedicada, no `ProductoPolicy` — ver StockController).
 */
class StockControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private User $userSinPermiso;

    private Producto $productoA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        app(PermissionRegistrar::class)->setPermissionsTeamId($this->empresaA->id);
        $rol = Role::create(['name' => 'Test Stock', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rol->givePermissionTo(['stock.ver', 'stock.editar', 'stock.gestionar']);
        $this->userA->assignRole($rol);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->productoA = Producto::create([
            'codigo' => 'TEST-001',
            'nombre' => 'Producto con stock',
            'stock_minimo' => 5,
            'stock_maximo' => 100,
            'empresa_id' => $this->empresaA->id,
        ]);
        // stock_actual no es fillable (propiedad exclusiva de
        // InventoryService) — se fuerza directamente para el fixture,
        // simulando un producto con movimientos previos ya reflejados.
        $this->productoA->forceFill(['stock_actual' => 42])->save();
    }

    public function test_there_is_no_create_endpoint_for_stock(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/stock', ['codigo' => 'X', 'nombre' => 'No debería poder crearse'])
            ->assertStatus(405);
    }

    public function test_a_user_can_view_and_list_their_own_companys_stock(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/stock/{$this->productoA->id}")
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Producto con stock')
            ->assertJsonPath('data.stock_actual', fn ($v) => (float) $v === 42.0)
            ->assertJsonPath('data.stock_minimo', fn ($v) => (float) $v === 5.0)
            ->assertJsonPath('data.stock_maximo', fn ($v) => (float) $v === 100.0)
            ->assertJsonPath('data.estado', 'activo');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/stock')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_search_filters_by_nombre_or_codigo(): void
    {
        Producto::create(['codigo' => 'X-999', 'nombre' => 'Otro producto distinto', 'empresa_id' => $this->empresaA->id]);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/stock?busqueda=TEST-001')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.codigo', 'TEST-001');
    }

    public function test_bajo_minimo_filter_only_returns_products_under_their_threshold(): void
    {
        $productoBajo = Producto::create(['codigo' => 'BAJO-001', 'nombre' => 'Producto bajo mínimo', 'stock_minimo' => 10, 'empresa_id' => $this->empresaA->id]);
        $productoBajo->forceFill(['stock_actual' => 1])->save();

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/stock?bajo_minimo=1')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.codigo', 'BAJO-001')
            ->assertJsonPath('data.items.0.bajo_minimo', true);
    }

    public function test_stock_at_its_exact_minimum_is_flagged_for_replenishment(): void
    {
        $this->productoA->forceFill(['stock_actual' => 5])->save();

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/stock?bajo_minimo=1')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.codigo', 'TEST-001')
            ->assertJsonPath('data.items.0.bajo_minimo', true);
    }

    public function test_updating_thresholds_persists_and_writes_audit(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/stock/{$this->productoA->id}", [
                'stock_minimo' => 20,
                'stock_maximo' => 200,
            ])
            ->assertOk()
            ->assertJsonPath('data.stock_minimo', fn ($v) => (float) $v === 20.0)
            ->assertJsonPath('data.stock_maximo', fn ($v) => (float) $v === 200.0);

        $this->productoA->refresh();
        $this->assertEquals(20, $this->productoA->stock_minimo);
        $this->assertEquals(200, $this->productoA->stock_maximo);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'stock', 'accion' => 'stock.editar']);
    }

    public function test_stock_actual_is_rejected_even_if_sent_in_the_payload(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/stock/{$this->productoA->id}", [
                'stock_actual' => 999,
                'stock_minimo' => 10,
            ])
            ->assertOk();

        // stock_actual nunca es un campo aceptado por este formulario —
        // solo InventoryService puede modificarlo.
        $this->assertEquals(42, $this->productoA->fresh()->stock_actual);
    }

    /**
     * PLAYWRIGHT — ATAQUE empresa_id (Work Order de cierre): UpdateStockRequest
     * nunca declara empresa_id en sus reglas, así que $request->validated()
     * lo excluye por completo antes de llegar a $producto->update() — mismo
     * mecanismo que ya protege stock_actual, verificado acá con evidencia
     * dedicada en vez de asumirlo por analogía.
     */
    public function test_empresa_id_is_rejected_even_if_sent_in_the_update_payload(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/stock/{$this->productoA->id}", [
                'empresa_id' => $this->empresaB->id,
                'stock_minimo' => 10,
            ])
            ->assertOk();

        $fresco = $this->productoA->fresh();
        $this->assertSame($this->empresaA->id, $fresco->empresa_id);
        $this->assertEquals(10, $fresco->stock_minimo);
    }

    public function test_producto_estado_is_rejected_even_if_sent_in_the_update_payload(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/stock/{$this->productoA->id}", [
                'estado' => 'inactivo',
                'stock_minimo' => 10,
            ])
            ->assertOk();

        // El estado de catálogo del producto nunca se toca desde Stock.
        $this->assertEquals('activo', $this->productoA->fresh()->estado);
    }

    public function test_disabling_stock_is_logical_never_touches_stock_actual_or_product_catalog_state(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/stock/{$this->productoA->id}/deshabilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');

        $fresco = $this->productoA->fresh();
        // Nunca revierte cantidad, nunca crea movimiento, nunca afecta el
        // estado de catálogo del producto (sigue siendo válido en
        // Productos/Captura IA/Proveedores/Movimientos).
        $this->assertEquals(42, $fresco->stock_actual);
        $this->assertSame('activo', $fresco->estado);
        $this->assertSame('inactivo', $fresco->stock_estado);
        $this->assertDatabaseCount('movimientos', 0);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'stock', 'accion' => 'stock.deshabilitar']);
    }

    public function test_disabled_stock_is_hidden_from_default_listing_but_visible_via_filter(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/stock/{$this->productoA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/stock')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/stock?estado=todos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_a_disabled_stock_can_be_re_enabled(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/stock/{$this->productoA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/stock/{$this->productoA->id}/habilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');

        $this->assertEquals(42, $this->productoA->fresh()->stock_actual);
    }

    public function test_company_b_cannot_view_update_or_disable_company_as_stock(): void
    {
        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/stock/{$this->productoA->id}")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/stock/{$this->productoA->id}", ['stock_minimo' => 999])
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/stock/{$this->productoA->id}/deshabilitar")
            ->assertNotFound();

        $this->assertEquals(5, $this->productoA->fresh()->stock_minimo);
        $this->assertSame('activo', $this->productoA->fresh()->stock_estado);
    }

    /**
     * Cierre de módulo (2026-08-11): el test de arriba cubre /deshabilitar
     * cruzado pero no /habilitar — mismo endpoint, mismo mecanismo
     * (resolverParaEmpresaActual), sin cobertura dedicada hasta ahora.
     */
    public function test_company_b_cannot_enable_company_as_stock(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/stock/{$this->productoA->id}/deshabilitar");

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/stock/{$this->productoA->id}/habilitar")
            ->assertNotFound();

        $this->assertSame('inactivo', $this->productoA->fresh()->stock_estado);
        $this->assertEquals(42, $this->productoA->fresh()->stock_actual);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/stock')->assertUnauthorized();
    }

    public function test_a_same_company_user_without_permission_is_rejected_with_403(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/stock')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/stock/{$this->productoA->id}")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/stock/{$this->productoA->id}", ['stock_minimo' => 999])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/stock/{$this->productoA->id}/deshabilitar")
            ->assertStatus(403);

        $this->assertEquals(5, $this->productoA->fresh()->stock_minimo);
        $this->assertSame('activo', $this->productoA->fresh()->stock_estado);
    }
}
