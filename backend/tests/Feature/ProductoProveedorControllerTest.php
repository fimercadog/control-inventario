<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\ProductoProveedor;
use App\Models\Proveedor;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md): relación
 * muchos-a-muchos Producto↔Proveedor. Borrado siempre lógico (GLOBAL
 * RULE, sesión 2026-07-29) — nunca un DELETE físico.
 *
 * Fase 4.5 (Authorization Alignment): `userA` tiene las 4
 * producto-proveedor.* (namespace propio, distinto de proveedores.*) —
 * cubre los casos de "usuario autorizado". `userSinPermiso` es de la
 * misma empresa pero sin esos permisos — prueba 403. Nota: estas rutas
 * también autorizan contra `ProductoPolicy` (sobre el Producto padre) —
 * doble chequeo por diseño desde Fase 4.5. `ProductoPolicy` en sí no
 * exigía permiso todavía en ese momento; Fase 4.6 (Authorization
 * Completion) lo cerró, así que `userA` ahora también necesita
 * `productos.ver`/`productos.editar` para esa primera capa, además de
 * producto-proveedor.* para la segunda.
 */
class ProductoProveedorControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private User $userSinPermiso;

    private Producto $productoA;

    private Proveedor $proveedorA1;

    private Proveedor $proveedorA2;

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
        $rol = Role::create(['name' => 'Test ProductoProveedor', 'guard_name' => 'api']);
        $rol->givePermissionTo([
            'producto-proveedor.ver', 'producto-proveedor.crear', 'producto-proveedor.editar', 'producto-proveedor.gestionar',
            // GET /proveedores/{id}/productos vive en ProveedorController (pestaña
            // "Products" de la Ficha de Proveedor), gateado por ProveedorPolicy.
            'proveedores.ver',
            // Fase 4.6: estas rutas autorizan primero contra ProductoPolicy
            // sobre el Producto padre (view para index, update para
            // store/registrarIngreso) antes de llegar al chequeo de
            // producto-proveedor.* propiamente dicho.
            'productos.ver', 'productos.editar',
        ]);
        $this->userA->assignRole($rol);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $categoria = Categoria::create(['nombre' => 'Test', 'estado' => 'activo']);
        $this->productoA = Producto::create(['categoria_id' => $categoria->id, 'codigo' => 'P-001', 'nombre' => 'Producto Test']);
        $this->proveedorA1 = Proveedor::create(['nombre' => 'Distribuidora Uno']);
        $this->proveedorA2 = Proveedor::create(['nombre' => 'Distribuidora Dos']);
    }

    public function test_a_user_can_associate_a_supplier_with_a_product(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores", [
                'proveedor_id' => $this->proveedorA1->id,
                'es_principal' => true,
                'precio_compra' => 15.5,
                'codigo_proveedor' => 'SKU-EXT-1',
            ])
            ->assertCreated()
            ->assertJsonPath('data.proveedor_id', $this->proveedorA1->id)
            ->assertJsonPath('data.es_principal', true)
            ->assertJsonPath('data.codigo_proveedor', 'SKU-EXT-1');

        $this->assertDatabaseHas('producto_proveedor', [
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
            'es_principal' => true,
        ]);
    }

    public function test_associating_a_supplier_writes_a_real_audit_log_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores", [
                'proveedor_id' => $this->proveedorA1->id,
            ]);

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'modulo' => 'producto_proveedor',
            'accion' => 'producto_proveedor.crear',
            'auditable_id' => $response->json('data.id'),
        ]);
    }

    public function test_only_one_primary_supplier_can_be_active_at_a_time(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores", [
                'proveedor_id' => $this->proveedorA1->id,
                'es_principal' => true,
            ])->assertCreated();

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores", [
                'proveedor_id' => $this->proveedorA2->id,
                'es_principal' => true,
            ])->assertCreated();

        $this->assertDatabaseHas('producto_proveedor', [
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
            'es_principal' => false,
        ]);
        $this->assertDatabaseHas('producto_proveedor', [
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA2->id,
            'es_principal' => true,
        ]);
    }

    public function test_a_user_can_list_active_supplier_associations_for_a_product(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $asociacion = ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
            'es_principal' => true,
        ]);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}/proveedores")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $asociacion->id)
            ->assertJsonPath('data.0.proveedor_nombre', 'Distribuidora Uno');
    }

    public function test_a_user_can_update_an_association(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $asociacion = ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
            'es_principal' => false,
        ]);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}/proveedores/{$asociacion->id}", [
                'precio_compra' => 22.75,
                'es_principal' => true,
            ])
            ->assertOk()
            ->assertJsonPath('data.es_principal', true);

        $this->assertSame('22.75', (string) $asociacion->fresh()->precio_compra);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'producto_proveedor', 'accion' => 'producto_proveedor.editar']);
    }

    public function test_disabling_an_association_is_logical_never_physical(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $asociacion = ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
        ]);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores/{$asociacion->id}/deshabilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');

        $this->assertDatabaseHas('producto_proveedor', ['id' => $asociacion->id, 'estado' => 'inactivo']);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'producto_proveedor', 'accion' => 'producto_proveedor.deshabilitar']);
    }

    public function test_disabled_association_is_hidden_from_the_products_supplier_list(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $asociacion = ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
        ]);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores/{$asociacion->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}/proveedores")
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_a_user_can_list_products_for_a_supplier(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
            'es_principal' => true,
        ]);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/proveedores/{$this->proveedorA1->id}/productos")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.producto_nombre', 'Producto Test');
    }

    public function test_an_association_must_belong_to_the_given_product(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $categoria = Categoria::where('empresa_id', $this->empresaA->id)->firstOrFail();
        $otroProducto = Producto::create(['categoria_id' => $categoria->id, 'codigo' => 'P-999', 'nombre' => 'Otro Producto']);
        $asociacion = ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
        ]);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$otroProducto->id}/proveedores/{$asociacion->id}", ['precio_compra' => 1])
            ->assertNotFound();
    }

    public function test_company_b_cannot_view_update_or_disable_company_as_association(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $asociacion = ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
        ]);

        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}/proveedores")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores", ['proveedor_id' => $this->proveedorA1->id])
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}/proveedores/{$asociacion->id}", ['precio_compra' => 1])
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores/{$asociacion->id}/deshabilitar")
            ->assertNotFound();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson("/api/v1/productos/{$this->productoA->id}/proveedores")->assertUnauthorized();
    }

    public function test_a_same_company_user_without_permission_is_rejected_with_403(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $asociacion = ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
        ]);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}/proveedores")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores", ['proveedor_id' => $this->proveedorA1->id])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}/proveedores/{$asociacion->id}", ['precio_compra' => 1])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/proveedores/{$asociacion->id}/deshabilitar")
            ->assertStatus(403);

        $this->assertSame('activo', $asociacion->fresh()->estado);
    }

    // Integración con Registrar Ingreso Manual — default al proveedor principal (FEATURE-005).

    public function test_registrar_ingreso_defaults_to_the_primary_supplier_when_none_specified(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
            'es_principal' => true,
        ]);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/movimientos", ['cantidad' => 10])
            ->assertCreated();

        $movimiento = Movimiento::where('producto_id', $this->productoA->id)->latest()->firstOrFail();
        $this->assertSame($this->proveedorA1->id, $movimiento->proveedor_id);
        $this->assertSame('Distribuidora Uno', $movimiento->proveedor);
    }

    public function test_registrar_ingreso_allows_overriding_the_primary_supplier(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        ProductoProveedor::create([
            'producto_id' => $this->productoA->id,
            'proveedor_id' => $this->proveedorA1->id,
            'es_principal' => true,
        ]);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/movimientos", [
                'cantidad' => 10,
                'proveedor_id' => $this->proveedorA2->id,
            ])
            ->assertCreated();

        $movimiento = Movimiento::where('producto_id', $this->productoA->id)->latest()->firstOrFail();
        $this->assertSame($this->proveedorA2->id, $movimiento->proveedor_id);
    }

    public function test_registrar_ingreso_has_no_supplier_when_none_specified_and_no_primary_exists(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/movimientos", ['cantidad' => 10])
            ->assertCreated();

        $movimiento = Movimiento::where('producto_id', $this->productoA->id)->latest()->firstOrFail();
        $this->assertNull($movimiento->proveedor_id);
    }
}
