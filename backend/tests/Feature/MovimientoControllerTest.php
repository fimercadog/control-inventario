<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Reglas confirmadas
 * explícitamente por el propietario del proyecto antes de esta unidad de
 * trabajo: un movimiento es el registro contable del inventario —
 * cantidad/tipo/producto/proveedor/stock son inmutables para siempre;
 * `update()` solo puede tocar metadata descriptiva; no existe ningún
 * endpoint de "eliminar"/"anular".
 */
class MovimientoControllerTest extends TestCase
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

        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $this->productoA = Producto::create(['codigo' => 'TEST-001', 'nombre' => 'Producto con movimientos']);
    }

    public function test_a_user_can_register_an_entrada_movement_and_stock_increases(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'entrada',
                'cantidad' => 50,
                'documento' => 'FAC-001',
            ])
            ->assertCreated()
            ->assertJsonPath('data.tipo', 'entrada')
            ->assertJsonPath('data.stock_anterior', fn ($v) => (float) $v === 0.0)
            ->assertJsonPath('data.stock_nuevo', fn ($v) => (float) $v === 50.0)
            ->assertJsonPath('data.delta', fn ($v) => (float) $v === 50.0);

        $this->assertEquals(50, $this->productoA->fresh()->stock_actual);
    }

    public function test_registering_a_movement_writes_a_real_audit_log_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'entrada',
                'cantidad' => 10,
            ]);

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'modulo' => 'movimientos',
            'accion' => 'movimientos.registrar_entrada',
            'auditable_id' => $response->json('data.id'),
        ]);
    }

    public function test_a_user_can_register_a_salida_movement_and_stock_decreases(): void
    {
        $this->productoA->forceFill(['stock_actual' => 100])->save();

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'salida',
                'cantidad' => 30,
            ])
            ->assertCreated()
            ->assertJsonPath('data.stock_nuevo', fn ($v) => (float) $v === 70.0)
            ->assertJsonPath('data.delta', fn ($v) => (float) $v === -30.0);

        $this->assertEquals(70, $this->productoA->fresh()->stock_actual);
    }

    public function test_a_salida_that_would_leave_stock_negative_is_rejected(): void
    {
        $this->productoA->forceFill(['stock_actual' => 10])->save();

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'salida',
                'cantidad' => 999,
            ])
            ->assertStatus(409);

        $this->assertEquals(10, $this->productoA->fresh()->stock_actual);
    }

    public function test_an_ajuste_can_increase_stock_with_direccion_incremento(): void
    {
        $this->productoA->forceFill(['stock_actual' => 20])->save();

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'ajuste',
                'cantidad' => 5,
                'direccion' => 'incremento',
                'observacion' => 'Conteo físico encontró más unidades',
            ])
            ->assertCreated()
            ->assertJsonPath('data.stock_nuevo', fn ($v) => (float) $v === 25.0)
            ->assertJsonPath('data.delta', fn ($v) => (float) $v === 5.0);

        $this->assertEquals(25, $this->productoA->fresh()->stock_actual);
    }

    public function test_an_ajuste_can_decrease_stock_with_direccion_decremento(): void
    {
        $this->productoA->forceFill(['stock_actual' => 20])->save();

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'ajuste',
                'cantidad' => 5,
                'direccion' => 'decremento',
                'observacion' => 'Conteo físico encontró menos unidades',
            ])
            ->assertCreated()
            ->assertJsonPath('data.stock_nuevo', fn ($v) => (float) $v === 15.0)
            ->assertJsonPath('data.delta', fn ($v) => (float) $v === -5.0);

        $this->assertEquals(15, $this->productoA->fresh()->stock_actual);
    }

    public function test_ajuste_without_direccion_is_rejected(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'ajuste',
                'cantidad' => 5,
            ])
            ->assertJsonValidationErrors('direccion');
    }

    public function test_direccion_is_rejected_for_entrada_and_salida(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'entrada',
                'cantidad' => 5,
                'direccion' => 'incremento',
            ])
            ->assertJsonValidationErrors('direccion');
    }

    public function test_entrada_can_associate_an_existing_supplier(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $proveedor = Proveedor::create(['nombre' => 'Proveedor Real']);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'entrada',
                'cantidad' => 10,
                'proveedor_id' => $proveedor->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.proveedor', 'Proveedor Real');
    }

    public function test_proveedor_id_is_rejected_for_salida_and_ajuste(): void
    {
        $this->productoA->forceFill(['stock_actual' => 100])->save();
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $proveedor = Proveedor::create(['nombre' => 'Proveedor X']);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'salida',
                'cantidad' => 10,
                'proveedor_id' => $proveedor->id,
            ])
            ->assertJsonValidationErrors('proveedor_id');
    }

    public function test_a_user_can_view_and_list_movements(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);

        $movimiento = $this->productoA->movimientos()->first();

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/movimientos/{$movimiento->id}")
            ->assertOk()
            ->assertJsonPath('data.producto', 'Producto con movimientos');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/movimientos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_filters_by_tipo_producto_and_search(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10, 'documento' => 'FAC-777']);

        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        $otroProducto = Producto::create(['codigo' => 'OTRO-001', 'nombre' => 'Otro producto']);
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $otroProducto->id, 'tipo' => 'salida', 'cantidad' => 1]);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/movimientos?tipo=entrada')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/movimientos?producto_id={$this->productoA->id}")
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/movimientos?busqueda=FAC-777')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_updating_metadata_persists_and_writes_audit(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);
        $movimiento = $this->productoA->movimientos()->first();

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/movimientos/{$movimiento->id}", ['observacion' => 'Corrección de texto'])
            ->assertOk()
            ->assertJsonPath('data.observacion', 'Corrección de texto');

        $this->assertSame('Corrección de texto', $movimiento->fresh()->observacion);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'movimientos', 'accion' => 'movimientos.editar_metadata']);
    }

    public function test_updating_a_movement_never_touches_cantidad_tipo_or_stock_even_if_sent_in_the_payload(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);
        $movimiento = $this->productoA->movimientos()->first();
        $cantidadOriginal = (float) $movimiento->cantidad;
        $tipoOriginal = $movimiento->tipo;
        $stockNuevoOriginal = (float) $movimiento->stock_nuevo;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/movimientos/{$movimiento->id}", [
                'cantidad' => 9999,
                'tipo' => 'salida',
                'stock_nuevo' => 0,
                'observacion' => 'Solo esto debería aplicarse',
            ])
            ->assertOk();

        $fresco = $movimiento->fresh();
        $this->assertEquals($cantidadOriginal, $fresco->cantidad);
        $this->assertSame($tipoOriginal, $fresco->tipo);
        $this->assertEquals($stockNuevoOriginal, $fresco->stock_nuevo);
        $this->assertSame('Solo esto debería aplicarse', $fresco->observacion);
        $this->assertEquals($stockNuevoOriginal, $this->productoA->fresh()->stock_actual);
    }

    public function test_there_is_no_delete_or_disable_endpoint_for_movements(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);
        $movimiento = $this->productoA->movimientos()->first();

        $this->actingAs($this->userA, 'api')
            ->deleteJson("/api/v1/movimientos/{$movimiento->id}")
            ->assertStatus(405);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/movimientos/{$movimiento->id}/deshabilitar")
            ->assertStatus(404);
    }

    public function test_company_b_cannot_view_update_or_create_movements_for_company_as_product(): void
    {
        $this->actingAs($this->userB, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10])
            ->assertStatus(404);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);
        $movimiento = $this->productoA->movimientos()->first();

        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/movimientos/{$movimiento->id}")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/movimientos/{$movimiento->id}", ['observacion' => 'Hackeado'])
            ->assertNotFound();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/movimientos')->assertUnauthorized();
    }
}
