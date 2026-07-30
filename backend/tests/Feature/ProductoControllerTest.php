<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Marca;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\UnidadMedida;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Ficha de producto (docs/03_FUNCTIONAL_SPEC/Products.md, adenda "Ficha
 * de Producto"): detalle, edición de catálogo, historial de movimientos
 * de un producto. `stock_actual` nunca debe ser editable vía este
 * endpoint — solo InventoryService puede modificarlo.
 */
class ProductoControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private Producto $productoA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);

        // Fixtures se crean con el contexto de tenant fijado explícitamente
        // (no via actingAs(), para dejar el guard 'api' limpio y poder
        // probar el caso genuinamente no autenticado más abajo).
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $categoria = Categoria::create(['nombre' => 'Alimentos', 'estado' => 'activo']);
        $marca = Marca::create(['nombre' => 'Marca X']);
        $unidadMedida = UnidadMedida::create(['nombre' => 'unidad']);
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
        ]);
    }

    public function test_index_lists_only_the_authenticated_companys_products(): void
    {
        // Producto de la empresa B, para confirmar que el listado de A no lo incluye.
        app(TenantContext::class)->setEmpresaId($this->empresaB->id);
        Producto::create(['codigo' => 'B-001', 'nombre' => 'Producto de otra empresa']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.codigo', 'TEST-001')
            ->assertJsonPath('data.items.0.categoria', 'Alimentos');
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
}
