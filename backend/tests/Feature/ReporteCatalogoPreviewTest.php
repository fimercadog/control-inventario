<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Categoria;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Reportes — ampliación 2026-08-03: catálogo de 13 reportes + preview.
 * Cubre la arquitectura (`ReporteController` delega a `ReporteService`
 * delega a la clase de `App\Reports\`), correctitud de datos reales
 * (nunca mock/JSON estático), aislamiento por empresa, y la regla de
 * privacidad heredada de Auditoría.
 */
class ReporteCatalogoPreviewTest extends TestCase
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
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id, 'name' => 'Ana Real']);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Reportes A', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolA->givePermissionTo(['reportes.ver']);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();
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
            'empresa_id' => $this->empresaA->id,
        ], $overrides));

        if ($stockActual !== null) {
            $producto->forceFill(['stock_actual' => $stockActual])->save();
        }

        return $producto->fresh();
    }

    public function test_catalog_lists_all_17_reports_with_their_metadata(): void
    {
        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/catalogo');

        $response->assertOk();
        $claves = collect($response->json('data'))->pluck('clave');

        $this->assertCount(17, $claves);
        $this->assertEqualsCanonicalizing([
            'inventario-resumen', 'stock-actual', 'stock-bajo', 'inventario-por-categoria',
            'inventario-por-marca', 'inventario-por-proveedor', 'movimientos-inventario',
            'kardex-producto', 'productos-sin-movimiento', 'proveedores', 'clientes',
            'actividad-usuarios', 'auditoria', 'crm-contactos', 'crm-oportunidades',
            'crm-actividades', 'crm-automatizaciones',
        ], $claves->all());

        $response->assertJsonStructure(['data' => [['clave', 'nombre', 'descripcion', 'filtros_disponibles']]]);
    }

    public function test_catalog_requires_reportes_ver_permission(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/reportes/catalogo')
            ->assertStatus(403);
    }

    public function test_stock_actual_preview_reflects_real_product_data(): void
    {
        $this->crearProducto(['nombre' => 'Producto Visible', 'stock_actual' => 20, 'stock_minimo' => 5]);
        $this->crearProducto(['nombre' => 'Producto Inactivo', 'estado' => 'inactivo']);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/stock-actual/preview');

        $response->assertOk();
        $response->assertJsonPath('data.total', 1);
        $response->assertJsonPath('data.filas.0.nombre', 'Producto Visible');
    }

    public function test_stock_bajo_only_returns_products_at_or_under_minimum(): void
    {
        $this->crearProducto(['nombre' => 'Stock Normal', 'stock_actual' => 50, 'stock_minimo' => 5]);
        $this->crearProducto(['nombre' => 'Stock Bajo', 'stock_actual' => 2, 'stock_minimo' => 5]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/stock-bajo/preview');

        $response->assertOk();
        $response->assertJsonPath('data.total', 1);
        $response->assertJsonPath('data.filas.0.nombre', 'Stock Bajo');
    }

    public function test_kardex_requires_producto_id_and_returns_a_validation_error_without_it(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/reportes/kardex-producto/preview')
            ->assertStatus(422);
    }

    public function test_kardex_returns_the_running_balance_in_chronological_order(): void
    {
        $producto = $this->crearProducto();

        $entrada = Movimiento::create([
            'producto_id' => $producto->id, 'tipo' => 'entrada', 'cantidad' => 10,
            'stock_anterior' => 0, 'stock_nuevo' => 10, 'empresa_id' => $this->empresaA->id,
        ]);
        $entrada->forceFill(['created_at' => now()->subDays(2)])->save();

        $salida = Movimiento::create([
            'producto_id' => $producto->id, 'tipo' => 'salida', 'cantidad' => 4,
            'stock_anterior' => 10, 'stock_nuevo' => 6, 'empresa_id' => $this->empresaA->id,
        ]);
        $salida->forceFill(['created_at' => now()->subDay()])->save();

        $response = $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/reportes/kardex-producto/preview?producto_id={$producto->id}");

        $response->assertOk();
        $response->assertJsonPath('data.total', 2);
        $this->assertEquals(10, $response->json('data.filas.0.entrada'));
        $this->assertEquals(10, $response->json('data.filas.0.saldo'));
        $this->assertEquals(4, $response->json('data.filas.1.salida'));
        $this->assertEquals(6, $response->json('data.filas.1.saldo'));
    }

    public function test_kardex_with_a_producto_id_belonging_to_company_b_is_rejected_not_leaked(): void
    {
        $productoB = Producto::create([
            'nombre' => 'Producto Empresa B', 'costo' => 10, 'stock_minimo' => 1,
            'estado' => 'activo', 'empresa_id' => $this->empresaB->id,
        ]);

        // IDOR (Fase 6): resolverParaEmpresaActual() ya rechaza el
        // producto ajeno antes de construir el kardex.
        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/reportes/kardex-producto/preview?producto_id={$productoB->id}")
            ->assertStatus(404);
    }

    public function test_movimientos_inventario_filtered_by_a_company_bs_producto_id_returns_empty_not_leaked(): void
    {
        $productoA = $this->crearProducto();
        Movimiento::create([
            'producto_id' => $productoA->id, 'tipo' => 'entrada', 'cantidad' => 5,
            'stock_anterior' => 0, 'stock_nuevo' => 5, 'empresa_id' => $this->empresaA->id,
        ]);

        $productoB = Producto::create([
            'nombre' => 'Producto Empresa B', 'costo' => 10, 'stock_minimo' => 1,
            'estado' => 'activo', 'empresa_id' => $this->empresaB->id,
        ]);
        Movimiento::create([
            'producto_id' => $productoB->id, 'tipo' => 'entrada', 'cantidad' => 999,
            'stock_anterior' => 0, 'stock_nuevo' => 999, 'empresa_id' => $this->empresaB->id,
        ]);

        // IDOR (Fase 6): el filtro producto_id no está protegido por su
        // cuenta, pero la consulta base ya está acotada a
        // movimientos.empresa_id = A antes de aplicarlo — pasar el id de
        // un producto de B nunca puede devolver el movimiento de B,
        // porque ningún movimiento de A referencia ese producto_id.
        $response = $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/reportes/movimientos-inventario/preview?producto_id={$productoB->id}");

        $response->assertOk();
        $response->assertJsonPath('data.total', 0);
    }

    public function test_movimientos_inventario_date_filter_is_inclusive_of_both_endpoints(): void
    {
        $producto = $this->crearProducto();
        $hoy = now()->toDateString();

        $movimiento = Movimiento::create([
            'producto_id' => $producto->id, 'tipo' => 'entrada', 'cantidad' => 1,
            'stock_anterior' => 0, 'stock_nuevo' => 1, 'empresa_id' => $this->empresaA->id,
        ]);
        // Un solo día, un solo movimiento — desde=hasta=hoy debe incluirlo
        // (Fase 9: "NO asumir inclusive/exclusive — verificarlo con datos
        // conocidos").
        $movimiento->forceFill(['created_at' => now()])->save();

        $response = $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/reportes/movimientos-inventario/preview?desde={$hoy}&hasta={$hoy}");

        $response->assertOk();
        $response->assertJsonPath('data.total', 1);
    }

    public function test_movimientos_inventario_with_an_inverted_date_range_returns_empty_not_an_error(): void
    {
        $producto = $this->crearProducto();
        Movimiento::create([
            'producto_id' => $producto->id, 'tipo' => 'entrada', 'cantidad' => 1,
            'stock_anterior' => 0, 'stock_nuevo' => 1, 'empresa_id' => $this->empresaA->id,
        ]);

        $desde = now()->toDateString();
        $hasta = now()->subDays(5)->toDateString();

        $response = $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/reportes/movimientos-inventario/preview?desde={$desde}&hasta={$hasta}");

        $response->assertOk();
        $response->assertJsonPath('data.total', 0);
    }

    public function test_movimientos_inventario_with_a_date_range_that_has_no_data_returns_an_empty_result(): void
    {
        $producto = $this->crearProducto();
        $movimiento = Movimiento::create([
            'producto_id' => $producto->id, 'tipo' => 'entrada', 'cantidad' => 1,
            'stock_anterior' => 0, 'stock_nuevo' => 1, 'empresa_id' => $this->empresaA->id,
        ]);
        $movimiento->forceFill(['created_at' => now()])->save();

        $response = $this->actingAs($this->userA, 'api')->getJson(
            '/api/v1/reportes/movimientos-inventario/preview?desde='.now()->subDays(60)->toDateString()
            .'&hasta='.now()->subDays(50)->toDateString()
        );

        $response->assertOk();
        $response->assertJsonPath('data.total', 0);
        $this->assertSame([], $response->json('data.filas'));
    }

    public function test_inventario_por_categoria_groups_and_sums_correctly(): void
    {
        $bebidas = Categoria::create(['nombre' => 'Bebidas', 'empresa_id' => $this->empresaA->id]);
        $this->crearProducto(['categoria_id' => $bebidas->id, 'costo' => 10, 'stock_actual' => 5]);
        $this->crearProducto(['categoria_id' => $bebidas->id, 'costo' => 20, 'stock_actual' => 5]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/inventario-por-categoria/preview');

        $response->assertOk();
        $response->assertJsonPath('data.filas.0.categoria', 'Bebidas');
        $response->assertJsonPath('data.filas.0.total_productos', 2);
        $this->assertEquals(150, $response->json('data.filas.0.valor_inventario'));
    }

    public function test_inventario_por_categoria_total_counts_groups_not_products(): void
    {
        $bebidas = Categoria::create(['nombre' => 'Bebidas', 'empresa_id' => $this->empresaA->id]);
        $limpieza = Categoria::create(['nombre' => 'Limpieza', 'empresa_id' => $this->empresaA->id]);
        // 3 productos en 2 categorías — si el GROUP BY se rompiera y
        // `total` contara filas de producto en vez de grupos, esto
        // devolvería 3, no 2 (Fase 11 del Work Order: "1 producto + 3
        // movimientos puede producir accidentalmente 3 productos si la
        // consulta está mal construida").
        $this->crearProducto(['categoria_id' => $bebidas->id]);
        $this->crearProducto(['categoria_id' => $bebidas->id]);
        $this->crearProducto(['categoria_id' => $limpieza->id]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/inventario-por-categoria/preview');

        $response->assertOk();
        $response->assertJsonPath('data.total', 2);
        $this->assertCount(2, $response->json('data.filas'));
    }

    public function test_preview_of_every_report_in_the_catalog_never_leaks_company_bs_data(): void
    {
        // Datos reales de Empresa B en cada entidad que alimenta al
        // menos un reporte del catálogo, todos con el mismo marcador
        // distintivo en el nombre para poder buscarlo en cualquier
        // shape de fila sin conocer las columnas de cada reporte.
        $marcador = 'MARCADOR-EMPRESA-B-EXCLUSIVO';

        $categoriaB = Categoria::create(['nombre' => "Categoria {$marcador}", 'empresa_id' => $this->empresaB->id]);
        $productoB = Producto::create([
            'nombre' => "Producto {$marcador}", 'costo' => 10, 'stock_minimo' => 1,
            'estado' => 'activo', 'empresa_id' => $this->empresaB->id, 'categoria_id' => $categoriaB->id,
        ]);
        $productoB->forceFill(['stock_actual' => 1])->save();

        $movimientoB = Movimiento::create([
            'producto_id' => $productoB->id, 'tipo' => 'entrada', 'cantidad' => 1,
            'stock_anterior' => 0, 'stock_nuevo' => 1, 'empresa_id' => $this->empresaB->id,
            'documento' => $marcador,
        ]);

        Proveedor::create(['nombre' => "Proveedor {$marcador}", 'nit' => 'B-1', 'estado' => 'activo', 'empresa_id' => $this->empresaB->id]);
        Cliente::create(['nombre' => "Cliente {$marcador}", 'nit' => 'B-2', 'estado' => 'activo', 'empresa_id' => $this->empresaB->id]);
        AuditLog::create([
            'empresa_id' => $this->empresaB->id, 'usuario_id' => null,
            'modulo' => $marcador, 'accion' => 'x.y', 'resultado' => 'exitoso',
        ]);

        // Al menos una fila propia de Empresa A por reporte, para que un
        // reporte que devuelve vacío en A no dé un falso PASS.
        $this->crearProducto(['categoria_id' => Categoria::create(['nombre' => 'Categoria A', 'empresa_id' => $this->empresaA->id])->id]);
        Proveedor::create(['nombre' => 'Proveedor A', 'nit' => 'A-1', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);
        Cliente::create(['nombre' => 'Cliente A', 'nit' => 'A-2', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);

        $claves = [
            'inventario-resumen', 'stock-actual', 'stock-bajo', 'inventario-por-categoria',
            'inventario-por-marca', 'inventario-por-proveedor', 'movimientos-inventario',
            'productos-sin-movimiento', 'proveedores', 'clientes', 'actividad-usuarios', 'auditoria',
            // kardex-producto excluido: exige producto_id, probado aparte
            // como IDOR explícito (Fase 6), no como "sin filtro" acá.
        ];

        foreach ($claves as $clave) {
            $response = $this->actingAs($this->userA, 'api')->getJson("/api/v1/reportes/{$clave}/preview");
            $response->assertOk();
            $this->assertStringNotContainsString(
                $marcador,
                json_encode($response->json('data')),
                "El reporte '{$clave}' expuso datos de Empresa B."
            );
        }

        // Movimiento B usado para no dejar la variable sin usar y para
        // documentar que también existe un movimiento real para que
        // movimientos-inventario tenga algo que filtrar y no dé un falso
        // PASS por ausencia total de datos.
        $this->assertNotNull($movimientoB->id);
    }

    public function test_proveedores_and_clientes_share_the_same_shape_via_the_base_class(): void
    {
        Proveedor::create(['nombre' => 'Proveedor Uno', 'nit' => '111', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);
        Cliente::create(['nombre' => 'Cliente Uno', 'nit' => '222', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);

        $proveedores = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/proveedores/preview');
        $clientes = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/clientes/preview');

        $proveedores->assertOk()->assertJsonPath('data.filas.0.nombre', 'Proveedor Uno');
        $clientes->assertOk()->assertJsonPath('data.filas.0.nombre', 'Cliente Uno');
        $this->assertSame(
            collect($proveedores->json('data.columnas'))->pluck('clave')->all(),
            collect($clientes->json('data.columnas'))->pluck('clave')->all(),
        );
    }

    public function test_movimientos_inventario_shows_the_real_user_name(): void
    {
        $producto = $this->crearProducto();
        Movimiento::create([
            'producto_id' => $producto->id, 'usuario_id' => $this->userA->id, 'tipo' => 'entrada',
            'cantidad' => 1, 'stock_anterior' => 0, 'stock_nuevo' => 1, 'empresa_id' => $this->empresaA->id,
        ]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/movimientos-inventario/preview');

        $response->assertOk();
        $response->assertJsonPath('data.filas.0.usuario', 'Ana Real');
    }

    public function test_actividad_usuarios_never_exposes_the_real_name_only_email_and_roles(): void
    {
        AuditLog::create([
            'empresa_id' => $this->empresaA->id, 'usuario_id' => $this->userA->id,
            'modulo' => 'productos', 'accion' => 'crear', 'resultado' => 'exito',
        ]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/actividad-usuarios/preview');

        $response->assertOk();
        $fila = collect($response->json('data.filas'))->firstWhere('usuario', $this->userA->email);
        $this->assertNotNull($fila, 'La fila debe identificar al usuario por email.');
        $this->assertStringNotContainsString('Ana Real', json_encode($response->json('data.filas')));
    }

    public function test_auditoria_report_never_exposes_the_real_name_either(): void
    {
        AuditLog::create([
            'empresa_id' => $this->empresaA->id, 'usuario_id' => $this->userA->id,
            'modulo' => 'productos', 'accion' => 'crear', 'resultado' => 'exito',
        ]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/auditoria/preview');

        $response->assertOk();
        $response->assertJsonPath('data.filas.0.usuario', $this->userA->email);
        $this->assertStringNotContainsString('Ana Real', json_encode($response->json('data.filas')));
    }

    public function test_preview_of_an_unknown_report_key_returns_a_validation_error(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/reportes/no-existe/preview')
            ->assertStatus(422);
    }

    public function test_preview_never_leaks_another_companys_data(): void
    {
        $this->crearProducto(['nombre' => 'Producto Empresa A']);

        Producto::create(['nombre' => 'Producto Empresa B', 'costo' => 1, 'stock_minimo' => 0, 'estado' => 'activo', 'empresa_id' => $this->empresaB->id]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/stock-actual/preview');

        $response->assertOk();
        $response->assertJsonPath('data.total', 1);
        $response->assertJsonPath('data.filas.0.nombre', 'Producto Empresa A');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/reportes/catalogo')->assertStatus(401);
    }
}
