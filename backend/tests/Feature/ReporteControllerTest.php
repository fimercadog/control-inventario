<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Cliente;
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
 * Reportes (2026-08-02). Sin tests de crear/editar/eliminar — "Reportes"
 * no es un recurso persistido, es una vista computada de solo lectura
 * sobre Productos/Movimientos/Clientes/Proveedores. El foco de esta suite
 * es que cada agregado sea matemáticamente correcto contra datos
 * conocidos, y que ninguno mezcle datos de otra empresa.
 */
class ReporteControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userSinPermiso;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $registrar = app(PermissionRegistrar::class);
        $context = app(TenantContext::class);

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Reportes A', 'guard_name' => 'api']);
        $rolA->givePermissionTo(['reportes.ver']);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
    }

    private function crearProducto(array $overrides = []): Producto
    {
        $stockActual = $overrides['stock_actual'] ?? null;
        unset($overrides['stock_actual']);

        $producto = Producto::create(array_merge([
            'nombre' => 'Producto '.uniqid(),
            'costo' => 10,
            'stock_minimo' => 5,
            'estado' => 'activo',
        ], $overrides));

        if ($stockActual !== null) {
            $producto->forceFill(['stock_actual' => $stockActual])->save();
        }

        return $producto->fresh();
    }

    public function test_a_user_can_view_the_reports_summary(): void
    {
        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes');

        $response->assertOk();
        $this->assertArrayHasKey('rango', $response->json('data'));
        $this->assertArrayHasKey('inventario', $response->json('data'));
        $this->assertArrayHasKey('movimientos', $response->json('data'));
        $this->assertArrayHasKey('clientes', $response->json('data'));
        $this->assertArrayHasKey('proveedores', $response->json('data'));
    }

    public function test_inventario_summary_reflects_real_product_data(): void
    {
        $this->crearProducto(['costo' => 10, 'stock_actual' => 20, 'stock_minimo' => 5]); // ok, valor 200
        $this->crearProducto(['costo' => 5, 'stock_actual' => 2, 'stock_minimo' => 10]);   // stock bajo, valor 10
        $this->crearProducto(['costo' => 8, 'stock_actual' => 0, 'stock_minimo' => 3]);    // sin stock, valor 0
        $this->crearProducto(['estado' => 'inactivo', 'stock_actual' => 999]);             // inactivo, no debe contar

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes');

        $response->assertOk();
        $response->assertJsonPath('data.inventario.total_productos', 3);
        $response->assertJsonPath('data.inventario.valor_total_inventario', 210);
        $response->assertJsonPath('data.inventario.productos_stock_bajo', 2); // stock_actual <= stock_minimo: el de 2<=10 y el de 0<=3
        $response->assertJsonPath('data.inventario.productos_sin_stock', 1);
    }

    public function test_productos_por_categoria_groups_correctly(): void
    {
        $bebidas = Categoria::create(['nombre' => 'Bebidas']);
        $snacks = Categoria::create(['nombre' => 'Snacks']);

        $this->crearProducto(['categoria_id' => $bebidas->id]);
        $this->crearProducto(['categoria_id' => $bebidas->id]);
        $this->crearProducto(['categoria_id' => $snacks->id]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes');

        $porCategoria = collect($response->json('data.inventario.productos_por_categoria'))->keyBy('categoria');
        $response->assertOk();
        $this->assertSame(2, $porCategoria['Bebidas']['total']);
        $this->assertSame(1, $porCategoria['Snacks']['total']);
    }

    public function test_movimientos_summary_only_counts_movements_within_the_requested_range(): void
    {
        $producto = $this->crearProducto();

        $dentro = Movimiento::create([
            'producto_id' => $producto->id, 'tipo' => 'entrada', 'cantidad' => 15,
            'stock_anterior' => 0, 'stock_nuevo' => 15,
        ]);
        $dentro->forceFill(['created_at' => now()->subDays(2)])->save();

        $fuera = Movimiento::create([
            'producto_id' => $producto->id, 'tipo' => 'entrada', 'cantidad' => 999,
            'stock_anterior' => 15, 'stock_nuevo' => 1014,
        ]);
        $fuera->forceFill(['created_at' => now()->subDays(60)])->save();

        $salida = Movimiento::create([
            'producto_id' => $producto->id, 'tipo' => 'salida', 'cantidad' => 5,
            'stock_anterior' => 1014, 'stock_nuevo' => 1009,
        ]);
        $salida->forceFill(['created_at' => now()->subDay()])->save();

        $response = $this->actingAs($this->userA, 'api')->getJson(
            '/api/v1/reportes?desde='.now()->subDays(7)->toDateString().'&hasta='.now()->toDateString()
        );

        $response->assertOk();
        $response->assertJsonPath('data.movimientos.entradas.total', 1);
        $response->assertJsonPath('data.movimientos.entradas.cantidad', 15);
        $response->assertJsonPath('data.movimientos.salidas.total', 1);
        $response->assertJsonPath('data.movimientos.salidas.cantidad', 5);
    }

    public function test_productos_mas_movidos_ranks_by_movement_count(): void
    {
        $popular = $this->crearProducto(['nombre' => 'Producto Popular']);
        $tranquilo = $this->crearProducto(['nombre' => 'Producto Tranquilo']);

        foreach (range(1, 3) as $i) {
            Movimiento::create([
                'producto_id' => $popular->id, 'tipo' => 'entrada', 'cantidad' => 1,
                'stock_anterior' => $i - 1, 'stock_nuevo' => $i,
            ]);
        }
        Movimiento::create([
            'producto_id' => $tranquilo->id, 'tipo' => 'entrada', 'cantidad' => 1,
            'stock_anterior' => 0, 'stock_nuevo' => 1,
        ]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes');

        $response->assertOk();
        $response->assertJsonPath('data.movimientos.productos_mas_movidos.0.producto', 'Producto Popular');
        $response->assertJsonPath('data.movimientos.productos_mas_movidos.0.total_movimientos', 3);
    }

    public function test_clientes_summary_reflects_real_client_data(): void
    {
        Cliente::create(['nombre' => 'Activo Uno', 'estado' => 'activo']);
        Cliente::create(['nombre' => 'Activo Dos', 'estado' => 'activo']);
        Cliente::create(['nombre' => 'Inactivo Uno', 'estado' => 'inactivo']);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes');

        $response->assertOk();
        $response->assertJsonPath('data.clientes.total_activos', 2);
        $response->assertJsonPath('data.clientes.total_inactivos', 1);
        $response->assertJsonPath('data.clientes.nuevos_ultimos_30_dias', 3);
    }

    public function test_proveedores_summary_and_top_proveedores(): void
    {
        $principal = Proveedor::create(['nombre' => 'Proveedor Principal', 'estado' => 'activo']);
        $secundario = Proveedor::create(['nombre' => 'Proveedor Secundario', 'estado' => 'activo']);
        Proveedor::create(['nombre' => 'Proveedor Inactivo', 'estado' => 'inactivo']);

        $productoUno = $this->crearProducto();
        $productoDos = $this->crearProducto();

        ProductoProveedor::create(['producto_id' => $productoUno->id, 'proveedor_id' => $principal->id, 'estado' => 'activo']);
        ProductoProveedor::create(['producto_id' => $productoDos->id, 'proveedor_id' => $principal->id, 'estado' => 'activo']);
        ProductoProveedor::create(['producto_id' => $productoUno->id, 'proveedor_id' => $secundario->id, 'estado' => 'activo']);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes');

        $response->assertOk();
        $response->assertJsonPath('data.proveedores.total_activos', 2);
        $response->assertJsonPath('data.proveedores.total_inactivos', 1);
        $response->assertJsonPath('data.proveedores.top_proveedores.0.proveedor', 'Proveedor Principal');
        $response->assertJsonPath('data.proveedores.top_proveedores.0.total_productos', 2);
    }

    public function test_default_date_range_is_the_last_30_days(): void
    {
        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes');

        $response->assertOk();
        $rango = $response->json('data.rango');
        $this->assertSame(now()->toDateString(), $rango['hasta']);
        $this->assertSame(now()->subDays(29)->toDateString(), $rango['desde']);
    }

    public function test_a_custom_date_range_is_respected(): void
    {
        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes?desde=2026-01-01&hasta=2026-01-31');

        $response->assertOk();
        $response->assertJsonPath('data.rango.desde', '2026-01-01');
        $response->assertJsonPath('data.rango.hasta', '2026-01-31');
    }

    public function test_company_b_data_never_leaks_into_company_as_report(): void
    {
        $this->crearProducto(['costo' => 100, 'stock_actual' => 10]); // Empresa A: valor 1000

        app(TenantContext::class)->setEmpresaId($this->empresaB->id);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->empresaB->id);
        $productoB = Producto::create(['nombre' => 'Producto B', 'costo' => 5000, 'stock_minimo' => 0, 'estado' => 'activo']);
        $productoB->forceFill(['stock_actual' => 999])->save();
        Cliente::create(['nombre' => 'Cliente B', 'estado' => 'activo']);
        Proveedor::create(['nombre' => 'Proveedor B', 'estado' => 'activo']);

        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->empresaA->id);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes');

        $response->assertOk();
        $response->assertJsonPath('data.inventario.total_productos', 1);
        $response->assertJsonPath('data.inventario.valor_total_inventario', 1000);
        $response->assertJsonPath('data.clientes.total_activos', 0);
        $response->assertJsonPath('data.proveedores.total_activos', 0);
    }

    public function test_there_is_no_write_endpoint_for_reportes(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/reportes', ['algo' => 'x'])
            ->assertStatus(405);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/reportes')->assertStatus(401);
    }

    public function test_a_user_without_permission_is_rejected_with_403(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/reportes')
            ->assertStatus(403);
    }
}
