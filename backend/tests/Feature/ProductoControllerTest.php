<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Marca;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\Role;
use App\Models\UnidadMedida;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Ficha de producto (docs/03_FUNCTIONAL_SPEC/Products.md, adenda "Ficha
 * de Producto"): detalle, edición de catálogo, historial de movimientos
 * de un producto. `stock_actual` nunca debe ser editable vía este
 * endpoint — solo InventoryService puede modificarlo.
 *
 * Fase 4.6 (Authorization Completion, docs/security/ROLES_MATRIX.md):
 * `userA` y `userB` reciben las 4 productos.* — el foco de este archivo
 * es CRUD + aislamiento de datos por empresa (ADR-008/ADR-009/ADR-018 —
 * FidelOS es una única base de datos central con `empresa_id`, no una
 * arquitectura multi-tenant), no permisos finos (ambas empresas
 * necesitan poder crear/editar productos propios en los tests ya
 * existentes). `userSinPermiso` es de la MISMA empresa que `productoA`
 * pero sin ningún permiso — prueba el caso 403, mismo patrón que
 * CategoriaControllerTest.
 */
class ProductoControllerTest extends TestCase
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

        $permisos = ['productos.ver', 'productos.crear', 'productos.editar', 'productos.gestionar'];
        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Productos A', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolA->givePermissionTo($permisos);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();

        $registrar->setPermissionsTeamId($this->empresaB->id);
        $rolB = Role::create(['name' => 'Test Productos B', 'guard_name' => 'api', 'empresa_id' => $this->empresaB->id]);
        $rolB->givePermissionTo($permisos);
        $this->userB->assignRole($rolB);
        $registrar->forgetCachedPermissions();

        // Fixtures se crean con empresa_id explícito (no via actingAs(),
        // para dejar el guard 'api' limpio y poder probar el caso
        // genuinamente no autenticado más abajo — ADR-019, sin EmpresaContext).
        $categoria = Categoria::create(['nombre' => 'Alimentos', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);
        $marca = Marca::create(['nombre' => 'Marca X', 'empresa_id' => $this->empresaA->id]);
        $unidadMedida = UnidadMedida::create(['nombre' => 'unidad', 'empresa_id' => $this->empresaA->id]);
        $this->productoA = Producto::create([
            'categoria_id' => $categoria->id,
            'codigo' => 'TEST-001',
            'nombre' => 'Producto de prueba',
            'marca_id' => $marca->id,
            'presentacion' => '1 kg',
            'costo' => 1000,
            'precio' => 1500,
            'unidad_medida_id' => $unidadMedida->id,
            'stock_minimo' => 5,
            'stock_maximo' => 100,
            'estado' => 'activo',
            'empresa_id' => $this->empresaA->id,
        ]);
    }

    public function test_index_lists_only_the_authenticated_companys_products(): void
    {
        // Producto de la empresa B, para confirmar que el listado de A no lo incluye.
        Producto::create(['codigo' => 'B-001', 'nombre' => 'Producto de otra empresa', 'empresa_id' => $this->empresaB->id]);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.codigo', 'TEST-001')
            ->assertJsonPath('data.items.0.categoria', 'Alimentos');
    }

    public function test_search_filters_by_nombre_or_marca(): void
    {
        Producto::create(['nombre' => 'Otro producto sin relación', 'empresa_id' => $this->empresaA->id]);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?busqueda=prueba')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.codigo', 'TEST-001');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?busqueda=Marca X')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.codigo', 'TEST-001');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?busqueda=no-existe-nada-parecido')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);
    }

    public function test_a_user_can_view_their_own_companys_product(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}")
            ->assertOk()
            ->assertJsonPath('data.codigo', 'TEST-001')
            ->assertJsonPath('data.nombre', 'Producto de prueba');
    }

    public function test_company_b_cannot_view_company_as_product(): void
    {
        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}")
            ->assertNotFound();
    }

    public function test_updating_editable_fields_persists_correctly(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", [
                'nombre' => 'Producto renombrado',
                'precio' => 2000,
            ])
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Producto renombrado')
            ->assertJsonPath('data.precio', fn ($precio) => (float) $precio === 2000.0);

        $this->assertSame('Producto renombrado', $this->productoA->fresh()->nombre);
    }

    public function test_stock_actual_is_rejected_even_if_sent_in_the_payload(): void
    {
        $stockOriginal = (float) $this->productoA->stock_actual;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", [
                'nombre' => 'Intento de forzar stock',
                'stock_actual' => 9999,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('stock_actual');

        $this->assertSame($stockOriginal, (float) $this->productoA->fresh()->stock_actual);
        $this->assertNotSame('Intento de forzar stock', $this->productoA->fresh()->nombre);
    }

    /**
     * Auditoría de RBAC 2026-08-10: `estado` fue removido de
     * `UpdateProductoRequest` (antes aceptado con solo `productos.editar`,
     * un permiso más laxo que `productos.gestionar`, el que exige
     * `/deshabilitar`). Mismo hallazgo y fix ya aplicados en Categorías.
     */
    public function test_estado_cannot_be_changed_via_the_generic_update_endpoint(): void
    {
        $this->assertSame('activo', $this->productoA->fresh()->estado);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", ['estado' => 'inactivo', 'nombre' => 'Sigue activo'])
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');

        $this->assertSame('activo', $this->productoA->fresh()->estado);
        $this->assertSame('Sigue activo', $this->productoA->fresh()->nombre);
    }

    /**
     * Payload consolidado del Work Order de auditoría: `id`/`empresa_id`/
     * `estado`/`created_at`/`updated_at` en un único PATCH junto a un campo
     * operativo válido. `stock_actual` tiene su propio test dedicado arriba
     * (usa `prohibited`, semántica de rechazo distinta a la exclusión
     * silenciosa de estos campos — combinarlos haría fallar la petición
     * completa con 422 antes de poder probar el resto).
     */
    public function test_mass_assignment_of_identity_and_controlled_fields_is_rejected_in_a_single_request(): void
    {
        $original = $this->productoA->fresh();
        $createdAtOriginal = $original->created_at;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", [
                'id' => 999999,
                'empresa_id' => $this->empresaB->id,
                'estado' => 'inactivo',
                'created_at' => '2000-01-01T00:00:00Z',
                'updated_at' => '2000-01-01T00:00:00Z',
                'nombre' => 'Nombre Válido Actualizado',
            ])
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Nombre Válido Actualizado');

        $actualizado = $this->productoA->fresh();
        $this->assertSame($this->productoA->id, $actualizado->id);
        $this->assertSame($this->empresaA->id, $actualizado->empresa_id);
        $this->assertSame('activo', $actualizado->estado);
        $this->assertTrue($createdAtOriginal->equalTo($actualizado->created_at));
        $this->assertSame('Nombre Válido Actualizado', $actualizado->nombre);
    }

    public function test_company_b_cannot_update_company_as_product(): void
    {
        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", ['nombre' => 'Hackeado'])
            ->assertNotFound();

        $this->assertNotSame('Hackeado', $this->productoA->fresh()->nombre);
    }

    public function test_movements_endpoint_returns_the_products_own_history(): void
    {
        Movimiento::create([
            'producto_id' => $this->productoA->id,
            'usuario_id' => $this->userA->id,
            'tipo' => 'entrada',
            'cantidad' => 10,
            'stock_anterior' => 0,
            'stock_nuevo' => 10,
            'observacion' => 'Movimiento de prueba',
            'empresa_id' => $this->empresaA->id,
        ]);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}/movimientos")
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.tipo', 'entrada');
    }

    public function test_company_b_cannot_see_company_as_movements(): void
    {
        Movimiento::create([
            'producto_id' => $this->productoA->id,
            'usuario_id' => $this->userA->id,
            'tipo' => 'entrada',
            'cantidad' => 10,
            'stock_anterior' => 0,
            'stock_nuevo' => 10,
            'empresa_id' => $this->empresaA->id,
        ]);

        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}/movimientos")
            ->assertNotFound();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson("/api/v1/productos/{$this->productoA->id}")
            ->assertUnauthorized();
    }

    // FEATURE-001 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2) — Crear Producto Manual

    public function test_a_user_can_create_a_product_manually_and_it_persists_with_zero_stock(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/productos', [
                'nombre' => 'Producto Manual Nuevo',
                'codigo' => 'MANUAL-001',
                'marca_nuevo' => 'Marca Manual',
                'costo' => 500,
                'precio' => 800,
            ])
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'Producto Manual Nuevo')
            ->assertJsonPath('data.marca', 'Marca Manual')
            ->assertJsonPath('data.stock_actual', fn ($stock) => (float) $stock === 0.0);

        $creado = Producto::where('codigo', 'MANUAL-001')->firstOrFail();
        $this->assertSame($this->empresaA->id, $creado->empresa_id);
        $this->assertDatabaseHas('marcas', ['nombre' => 'Marca Manual', 'empresa_id' => $this->empresaA->id]);
        $this->assertSame(0.0, (float) $creado->stock_actual);
    }

    public function test_creating_a_product_manually_writes_a_real_audit_log_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/productos', ['nombre' => 'Producto Auditado']);

        $productoId = $response->json('data.id');

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'usuario_id' => $this->userA->id,
            'modulo' => 'productos',
            'accion' => 'productos.crear_manual',
            'auditable_type' => Producto::class,
            'auditable_id' => $productoId,
        ]);
    }

    public function test_stock_actual_cannot_be_set_via_manual_creation(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/productos', [
                'nombre' => 'Intento de forzar stock inicial',
                'stock_actual' => 500,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('stock_actual');
    }

    public function test_company_b_creates_its_own_product_isolated_from_company_a(): void
    {
        $this->actingAs($this->userB, 'api')
            ->postJson('/api/v1/productos', ['nombre' => 'Producto de Empresa B'])
            ->assertCreated();

        $creado = Producto::withoutGlobalScopes()->where('nombre', 'Producto de Empresa B')->firstOrFail();
        $this->assertSame($this->empresaB->id, $creado->empresa_id);
    }

    // FEATURE-002 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2) — Registrar Ingreso Manual

    public function test_registering_a_manual_income_creates_a_movement_and_updates_stock(): void
    {
        $stockInicial = (float) $this->productoA->stock_actual;

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/movimientos", [
                'cantidad' => 25,
                'costo' => 1200,
                'proveedor_nuevo' => 'Distribuidora Central',
                'documento' => 'FAC-001',
                'observacion' => 'Ingreso inicial de stock',
                'lote' => 'L-2026-01',
                'vencimiento' => '2027-01-15',
            ])
            ->assertCreated()
            ->assertJsonPath('data.stock_actual', fn ($stock) => (float) $stock === $stockInicial + 25.0);

        $movimiento = Movimiento::where('producto_id', $this->productoA->id)->latest()->firstOrFail();
        $this->assertSame('entrada', $movimiento->tipo);
        $this->assertSame(25.0, (float) $movimiento->cantidad);
        $this->assertSame('Distribuidora Central', $movimiento->proveedor);
        $this->assertNotNull($movimiento->proveedor_id);
        $this->assertSame('L-2026-01', $movimiento->lote);
        $this->assertSame('2027-01-15', $movimiento->vencimiento->toDateString());
        $this->assertSame($stockInicial + 25.0, (float) $this->productoA->fresh()->stock_actual);
    }

    public function test_registering_a_manual_income_writes_a_real_audit_log_entry(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/movimientos", ['cantidad' => 5]);

        $movimiento = Movimiento::where('producto_id', $this->productoA->id)->latest()->firstOrFail();

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'usuario_id' => $this->userA->id,
            'modulo' => 'movimientos',
            'accion' => 'movimientos.registrar_ingreso_manual',
            'auditable_type' => Movimiento::class,
            'auditable_id' => $movimiento->id,
        ]);
    }

    public function test_manual_income_immediately_appears_in_the_movements_tab(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/movimientos", ['cantidad' => 8]);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}/movimientos")
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.cantidad', fn ($cantidad) => (float) $cantidad === 8.0);
    }

    public function test_company_b_cannot_register_income_for_company_as_product(): void
    {
        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/movimientos", ['cantidad' => 5])
            ->assertNotFound();

        $this->assertDatabaseMissing('movimientos', ['producto_id' => $this->productoA->id]);
    }

    // Auditoría de cierre de módulo (2026-08-11) — categoria_id/marca_id/
    // unidad_medida_id nunca deben poder apuntar a un registro de otra
    // empresa. Regresión real: antes de este fix, `ProductService` los
    // aceptaba tal cual venían del payload sin verificar pertenencia
    // (confirmado explotable con un HTTP 201 real antes de corregirlo) —
    // mismo criterio que ya protegía a `proveedor_id` en
    // `ProductoProveedorController::store()`.

    public function test_creating_a_product_with_another_companys_categoria_id_is_rejected(): void
    {
        $categoriaB = Categoria::create(['nombre' => 'Categoria B', 'estado' => 'activo', 'empresa_id' => $this->empresaB->id]);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/productos', [
                'nombre' => 'Intento de categoria ajena',
                'categoria_id' => $categoriaB->id,
            ])
            ->assertNotFound();

        $this->assertDatabaseMissing('productos', ['nombre' => 'Intento de categoria ajena']);
    }

    public function test_creating_a_product_with_another_companys_marca_id_is_rejected(): void
    {
        $marcaB = Marca::create(['nombre' => 'Marca B', 'empresa_id' => $this->empresaB->id]);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/productos', [
                'nombre' => 'Intento de marca ajena',
                'marca_id' => $marcaB->id,
            ])
            ->assertNotFound();

        $this->assertDatabaseMissing('productos', ['nombre' => 'Intento de marca ajena']);
    }

    public function test_creating_a_product_with_another_companys_unidad_medida_id_is_rejected(): void
    {
        $unidadB = UnidadMedida::create(['nombre' => 'Unidad B', 'empresa_id' => $this->empresaB->id]);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/productos', [
                'nombre' => 'Intento de unidad ajena',
                'unidad_medida_id' => $unidadB->id,
            ])
            ->assertNotFound();

        $this->assertDatabaseMissing('productos', ['nombre' => 'Intento de unidad ajena']);
    }

    public function test_updating_a_product_with_another_companys_categoria_id_is_rejected(): void
    {
        $categoriaB = Categoria::create(['nombre' => 'Categoria B', 'estado' => 'activo', 'empresa_id' => $this->empresaB->id]);
        $categoriaOriginal = $this->productoA->categoria_id;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", ['categoria_id' => $categoriaB->id])
            ->assertNotFound();

        $this->assertSame($categoriaOriginal, $this->productoA->fresh()->categoria_id);
    }

    public function test_updating_a_product_with_another_companys_marca_id_is_rejected(): void
    {
        $marcaB = Marca::create(['nombre' => 'Marca B', 'empresa_id' => $this->empresaB->id]);
        $marcaOriginal = $this->productoA->marca_id;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", ['marca_id' => $marcaB->id])
            ->assertNotFound();

        $this->assertSame($marcaOriginal, $this->productoA->fresh()->marca_id);
    }

    public function test_updating_a_product_with_another_companys_unidad_medida_id_is_rejected(): void
    {
        $unidadB = UnidadMedida::create(['nombre' => 'Unidad B', 'empresa_id' => $this->empresaB->id]);
        $unidadOriginal = $this->productoA->unidad_medida_id;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", ['unidad_medida_id' => $unidadB->id])
            ->assertNotFound();

        $this->assertSame($unidadOriginal, $this->productoA->fresh()->unidad_medida_id);
    }

    /**
     * Contraprueba de los 6 tests de arriba — confirma que el fix no
     * bloquea el caso legítimo, solo el cruzado. También cierra el
     * hallazgo F1 de la auditoría de frontend: `categoria_id` nunca tenía
     * un camino de escritura real en ningún formulario pese a que el
     * backend y el spec siempre lo soportaron.
     */
    public function test_creating_a_product_with_a_valid_same_company_categoria_id_persists_correctly(): void
    {
        $otraCategoria = Categoria::create(['nombre' => 'Bebidas', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/productos', [
                'nombre' => 'Producto con categoria valida',
                'categoria_id' => $otraCategoria->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.categoria_id', $otraCategoria->id)
            ->assertJsonPath('data.categoria', 'Bebidas');

        $creado = Producto::where('nombre', 'Producto con categoria valida')->firstOrFail();
        $this->assertSame($otraCategoria->id, $creado->categoria_id);
    }

    public function test_updating_a_product_with_a_valid_same_company_categoria_id_persists_correctly(): void
    {
        $otraCategoria = Categoria::create(['nombre' => 'Bebidas', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", ['categoria_id' => $otraCategoria->id])
            ->assertOk()
            ->assertJsonPath('data.categoria_id', $otraCategoria->id)
            ->assertJsonPath('data.categoria', 'Bebidas');

        $this->assertSame($otraCategoria->id, $this->productoA->fresh()->categoria_id);
    }

    // Corrección de auditoría funcional (docs/06_TESTS/DemoDataAudit.md) — Eliminación lógica

    public function test_disabling_a_product_is_logical_never_physical(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/deshabilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');

        // La fila sigue existiendo — nunca un DELETE físico.
        $this->assertDatabaseHas('productos', ['id' => $this->productoA->id, 'estado' => 'inactivo']);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'productos', 'accion' => 'productos.deshabilitar']);
    }

    public function test_disabled_product_is_hidden_from_default_listing_but_visible_via_filter(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?estado=todos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_a_disabled_product_can_be_re_enabled(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/habilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');

        $this->assertDatabaseHas('audit_logs', ['modulo' => 'productos', 'accion' => 'productos.habilitar']);
    }

    public function test_disabling_a_product_never_touches_its_stock(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/movimientos", ['cantidad' => 25]);

        $stockAntes = (float) $this->productoA->fresh()->stock_actual;

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/deshabilitar")
            ->assertOk();

        $this->assertSame($stockAntes, (float) $this->productoA->fresh()->stock_actual);
        $this->assertDatabaseCount('movimientos', 1);
    }

    public function test_company_b_cannot_disable_or_enable_company_as_product(): void
    {
        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/deshabilitar")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/habilitar")
            ->assertNotFound();

        $this->assertSame('activo', $this->productoA->fresh()->estado);
    }

    // Fase 4.6 (Authorization Completion) — mismo usuario/empresa que
    // productoA, cero permisos: cada acción debe rechazarse con 403, nunca
    // llegar a tocar el registro (`disable()` exige `productos.gestionar`,
    // el resto exige `productos.ver`/`productos.crear`/`productos.editar`).
    public function test_a_same_company_user_without_permission_is_rejected_with_403(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/productos')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson('/api/v1/productos', ['nombre' => 'Sin permiso'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/productos/{$this->productoA->id}", ['nombre' => 'Hackeado'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/movimientos", ['cantidad' => 5])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/deshabilitar")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/productos/{$this->productoA->id}/habilitar")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/productos/{$this->productoA->id}/movimientos")
            ->assertStatus(403);

        $this->assertDatabaseMissing('productos', ['nombre' => 'Sin permiso']);
        $this->assertNotSame('Hackeado', $this->productoA->fresh()->nombre);
        $this->assertSame('activo', $this->productoA->fresh()->estado);
        $this->assertDatabaseMissing('movimientos', ['producto_id' => $this->productoA->id]);
    }
}
