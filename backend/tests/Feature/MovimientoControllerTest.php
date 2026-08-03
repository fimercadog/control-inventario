<?php

namespace Tests\Feature;

use App\Models\CapturaIA;
use App\Models\CapturaIADetalle;
use App\Models\Empresa;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Role;
use App\Models\UnidadMedida;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Reglas confirmadas
 * explícitamente por el propietario del proyecto antes de esta unidad de
 * trabajo: un movimiento es el registro contable del inventario —
 * cantidad/tipo/producto/proveedor/stock son inmutables para siempre;
 * `update()` solo puede tocar metadata descriptiva; no existe ningún
 * endpoint de "eliminar"/"anular".
 *
 * Fase 4.6 (Authorization Completion, docs/security/ROLES_MATRIX.md):
 * `userA` y `userB` reciben `movimientos.ver`/`movimientos.crear` — ambas
 * empresas necesitan poder listar/crear en los tests de aislamiento ya
 * existentes. Deliberadamente NO se otorga ningún permiso de "editar":
 * no existe `movimientos.editar` en el catálogo — `update()` (solo
 * metadata descriptiva) permanece abierto a cualquier usuario autenticado
 * de la empresa, por diseño (ver MovimientoPolicy::update()).
 * `userSinPermiso` es de la MISMA empresa que `productoA` pero sin
 * `movimientos.ver`/`movimientos.crear` — prueba el caso 403.
 */
class MovimientoControllerTest extends TestCase
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

        $permisos = ['movimientos.ver', 'movimientos.crear'];
        $registrar = app(PermissionRegistrar::class);
        $context = app(TenantContext::class);

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Movimientos A', 'guard_name' => 'api']);
        $rolA->givePermissionTo($permisos);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaB->id);
        $registrar->setPermissionsTeamId($this->empresaB->id);
        $rolB = Role::create(['name' => 'Test Movimientos B', 'guard_name' => 'api']);
        $rolB->givePermissionTo($permisos);
        $this->userB->assignRole($rolB);
        $registrar->forgetCachedPermissions();

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
            ->assertStatus(409)
            ->assertJsonPath('message', 'Stock insuficiente para el producto #'.$this->productoA->id.'. Disponible: 10.00. Solicitado: 999.00.');

        $this->assertEquals(10, $this->productoA->fresh()->stock_actual);
    }

    /**
     * Caso límite explícito: una salida que consume EXACTAMENTE el stock
     * disponible debe tener éxito y dejar el producto en 0 — 0 no es
     * negativo. Distingue el límite real (`$stockNuevo < 0`) de un límite
     * off-by-one incorrecto (`<= 0`) que rechazaría este caso válido.
     */
    public function test_a_salida_that_leaves_stock_at_exactly_zero_succeeds(): void
    {
        $this->productoA->forceFill(['stock_actual' => 10])->save();

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'salida',
                'cantidad' => 10,
            ])
            ->assertCreated()
            ->assertJsonPath('data.stock_nuevo', fn ($v) => (float) $v === 0.0);

        $this->assertEquals(0, $this->productoA->fresh()->stock_actual);
    }

    /**
     * `InventoryService::registrarMovimiento()` bloquea la fila del
     * producto con `lockForUpdate()` dentro de una transacción — bajo
     * concurrencia real, dos salidas simultáneas para el mismo producto se
     * serializan sobre ese lock: la segunda solo empieza a leer
     * `stock_actual` después de que la primera ya hizo commit. PHPUnit
     * ejecuta el cliente HTTP de test de forma síncrona en un solo
     * proceso, así que este test no puede disparar dos requests en
     * paralelo de verdad — en su lugar, verifica la MISMA garantía de
     * comportamiento que ese lock produce: dos salidas consecutivas cuya
     * suma excede el stock disponible nunca dejan el stock en negativo, y
     * la segunda ve el efecto ya aplicado de la primera (nunca lee un
     * valor obsoleto/pre-commit).
     */
    public function test_two_salidas_that_together_exceed_stock_never_leave_it_negative(): void
    {
        $this->productoA->forceFill(['stock_actual' => 10])->save();

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'salida',
                'cantidad' => 6,
            ])
            ->assertCreated()
            ->assertJsonPath('data.stock_nuevo', fn ($v) => (float) $v === 4.0);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', [
                'producto_id' => $this->productoA->id,
                'tipo' => 'salida',
                'cantidad' => 6,
            ])
            ->assertStatus(409)
            ->assertJsonPath('message', 'Stock insuficiente para el producto #'.$this->productoA->id.'. Disponible: 4.00. Solicitado: 6.00.');

        $this->assertEquals(4, $this->productoA->fresh()->stock_actual);
        $this->assertEquals(1, $this->productoA->fresh()->movimientos()->count());
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

    // Fase 4.6 (Authorization Completion) — mismo usuario/empresa que
    // productoA, sin movimientos.ver/movimientos.crear: listar, ver o
    // crear se rechaza con 403 y no debe crear ningún registro.
    public function test_a_same_company_user_without_permission_is_rejected_from_viewing_or_creating(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);
        $movimiento = $this->productoA->movimientos()->first();

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/movimientos')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/movimientos/{$movimiento->id}")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 5])
            ->assertStatus(403);

        $this->assertDatabaseCount('movimientos', 1); // solo el de userA — el intento sin permiso no crea nada
    }

    // Regla de negocio explícita de esta fase: no existe `movimientos.editar`
    // en el catálogo — editar metadata descriptiva NO requiere ningún
    // permiso, solo pertenecer a la empresa (MovimientoPolicy::update()).
    public function test_updating_metadata_does_not_require_any_permission_by_design(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);
        $movimiento = $this->productoA->movimientos()->first();

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/movimientos/{$movimiento->id}", ['observacion' => 'Editado sin permisos de movimientos'])
            ->assertOk();

        $this->assertSame('Editado sin permisos de movimientos', $movimiento->fresh()->observacion);
    }

    /**
     * Ampliación de UX 2026-08-03 (docs/03_FUNCTIONAL_SPEC/Movements.md):
     * la lista mostraba solo "Salida -12.03" sin contexto. `unidad_medida`/
     * `origen`/`tiene_evidencia` son campos derivados, puramente de
     * presentación — no tocan `stock_actual` ni el ledger.
     */
    public function test_movement_response_exposes_the_products_unit_of_measure(): void
    {
        $unidad = UnidadMedida::create(['nombre' => 'Kilogramo', 'abreviatura' => 'kg']);
        $this->productoA->update(['unidad_medida_id' => $unidad->id]);

        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);

        $response->assertJsonPath('data.unidad_medida', 'kg');
    }

    public function test_movement_origin_defaults_to_manual_for_a_regular_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);

        $response->assertJsonPath('data.origen', 'manual')
            ->assertJsonPath('data.tiene_evidencia', false);
    }

    /**
     * El único "origen" real distinguible hoy es la convención existente
     * `documento === 'captura_ia'` (`ApplyInventoryMovementAction`) — no
     * hay una columna/enum de origen real. Se construye ese caso
     * directamente para probar la derivación, sin pasar por el pipeline
     * completo de Captura IA (fuera de alcance de este test).
     */
    public function test_movement_origin_is_captura_ia_when_the_documento_convention_matches(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);
        $movimiento = $this->productoA->movimientos()->first();
        $movimiento->forceFill(['documento' => 'captura_ia'])->save();

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/movimientos/{$movimiento->id}")
            ->assertJsonPath('data.origen', 'captura_ia');
    }

    public function test_movement_evidence_flag_is_true_only_when_a_linked_captura_has_a_file(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/movimientos', ['producto_id' => $this->productoA->id, 'tipo' => 'entrada', 'cantidad' => 10]);
        $movimiento = $this->productoA->movimientos()->first();

        $captura = CapturaIA::create([
            'empresa_id' => $this->empresaA->id,
            'usuario_id' => $this->userA->id,
            'tipo' => 'foto',
            'archivo_path' => 'capturas/evidencia-test.jpg',
            'estado' => 'aplicado',
        ]);
        CapturaIADetalle::create([
            'captura_id' => $captura->id,
            'producto_id' => $this->productoA->id,
            'movimiento_id' => $movimiento->id,
            'nombre_detectado' => $this->productoA->nombre,
            'cantidad_detectada' => 10,
            'confianza' => 0.95,
            'es_producto_nuevo' => false,
            'estado' => 'aplicado',
        ]);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/movimientos/{$movimiento->id}")
            ->assertJsonPath('data.tiene_evidencia', true);
    }
}
