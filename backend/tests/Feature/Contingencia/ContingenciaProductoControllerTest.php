<?php

namespace Tests\Feature\Contingencia;

use App\Models\Empresa;
use App\Models\Producto;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Modo Contingencia (docs/03_FUNCTIONAL_SPEC/ProductContingencyMode.md,
 * Work Order). El endpoint procesa UNA operación offline de Producto por
 * vez — nunca toca stock_actual/InventoryService (fuera de alcance), y
 * reusa ProductoPolicy sin ninguna excepción: el Modo Contingencia nunca
 * otorga un permiso que el usuario no tenía.
 */
class ContingenciaProductoControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userConPermisos;

    private User $userSinCrear;

    private User $userSinEditar;

    private User $userEmpresaB;

    private Producto $productoA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);

        $this->userConPermisos = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userSinCrear = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userSinEditar = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userEmpresaB = User::factory()->create(['empresa_id' => $this->empresaB->id]);

        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolCompleto = Role::create(['name' => 'Contingencia Full', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolCompleto->givePermissionTo(['productos.ver', 'productos.crear', 'productos.editar']);
        $this->userConPermisos->assignRole($rolCompleto);

        $rolSinCrear = Role::create(['name' => 'Contingencia Sin Crear', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolSinCrear->givePermissionTo(['productos.ver', 'productos.editar']);
        $this->userSinCrear->assignRole($rolSinCrear);

        $rolSinEditar = Role::create(['name' => 'Contingencia Sin Editar', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolSinEditar->givePermissionTo(['productos.ver', 'productos.crear']);
        $this->userSinEditar->assignRole($rolSinEditar);
        $registrar->forgetCachedPermissions();

        $registrar->setPermissionsTeamId($this->empresaB->id);
        $rolB = Role::create(['name' => 'Contingencia B', 'guard_name' => 'api', 'empresa_id' => $this->empresaB->id]);
        $rolB->givePermissionTo(['productos.ver', 'productos.crear', 'productos.editar']);
        $this->userEmpresaB->assignRole($rolB);
        $registrar->forgetCachedPermissions();

        $this->productoA = Producto::create([
            'empresa_id' => $this->empresaA->id,
            'codigo' => 'CONT-001',
            'nombre' => 'Producto Contingencia',
            'precio' => 100,
        ]);
    }

    public function test_a_user_with_permission_can_create_a_product_via_sync(): void
    {
        $operacionId = (string) Str::uuid();

        $respuesta = $this->actingAs($this->userConPermisos, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', [
                'operacion_id' => $operacionId,
                'tipo' => 'crear',
                'payload' => ['nombre' => 'Producto Offline', 'precio' => 50],
            ]);

        $respuesta->assertOk();
        $respuesta->assertJsonPath('data.nombre', 'Producto Offline');

        $this->assertDatabaseHas('productos', ['nombre' => 'Producto Offline', 'empresa_id' => $this->empresaA->id]);
        $this->assertDatabaseHas('contingencia_sync_log', ['operacion_id' => $operacionId, 'empresa_id' => $this->empresaA->id]);
        $this->assertDatabaseHas('audit_logs', ['accion' => 'contingencia.procesar_crear']);
    }

    public function test_a_user_without_productos_crear_cannot_create_via_sync(): void
    {
        $respuesta = $this->actingAs($this->userSinCrear, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', [
                'operacion_id' => (string) Str::uuid(),
                'tipo' => 'crear',
                'payload' => ['nombre' => 'No debería crearse'],
            ]);

        $respuesta->assertForbidden();
        $this->assertDatabaseMissing('productos', ['nombre' => 'No debería crearse']);
    }

    public function test_replaying_the_same_operacion_id_never_creates_a_duplicate(): void
    {
        $operacionId = (string) Str::uuid();
        $payload = [
            'operacion_id' => $operacionId,
            'tipo' => 'crear',
            'payload' => ['nombre' => 'Sin Duplicar'],
        ];

        $primera = $this->actingAs($this->userConPermisos, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', $payload);
        $primera->assertOk();
        $idCreado = $primera->json('data.id');

        $segunda = $this->actingAs($this->userConPermisos, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', $payload);
        $segunda->assertOk();

        $this->assertSame($idCreado, $segunda->json('data.id'));
        $this->assertDatabaseCount('productos', 1 + 1); // productoA del setUp + este único
        $this->assertDatabaseCount('contingencia_sync_log', 1);
    }

    public function test_a_user_with_permission_can_update_a_product_via_sync_with_the_correct_base_version(): void
    {
        $respuesta = $this->actingAs($this->userConPermisos, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', [
                'operacion_id' => (string) Str::uuid(),
                'tipo' => 'actualizar',
                'producto_id' => $this->productoA->id,
                'base_version' => $this->productoA->updated_at->toIso8601String(),
                'payload' => ['nombre' => 'Producto Actualizado Offline'],
            ]);

        $respuesta->assertOk();
        $respuesta->assertJsonPath('data.nombre', 'Producto Actualizado Offline');
        $this->assertDatabaseHas('productos', ['id' => $this->productoA->id, 'nombre' => 'Producto Actualizado Offline']);
    }

    public function test_update_with_a_stale_base_version_returns_a_conflict_and_does_not_overwrite(): void
    {
        // Alguien más cambia el producto en el servidor DESPUÉS de que el
        // cliente offline capturó su base_version.
        $baseVersionVieja = $this->productoA->updated_at->toIso8601String();
        sleep(1);
        $this->productoA->update(['nombre' => 'Cambiado en el servidor']);

        $respuesta = $this->actingAs($this->userConPermisos, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', [
                'operacion_id' => (string) Str::uuid(),
                'tipo' => 'actualizar',
                'producto_id' => $this->productoA->id,
                'base_version' => $baseVersionVieja,
                'payload' => ['nombre' => 'Intento offline desactualizado'],
            ]);

        $respuesta->assertStatus(409);
        $respuesta->assertJsonPath('errors.producto_servidor.nombre', 'Cambiado en el servidor');

        $this->assertDatabaseHas('productos', ['id' => $this->productoA->id, 'nombre' => 'Cambiado en el servidor']);
        $this->assertDatabaseMissing('productos', ['nombre' => 'Intento offline desactualizado']);
        $this->assertDatabaseMissing('contingencia_sync_log', ['producto_id' => $this->productoA->id]);
    }

    public function test_a_user_without_productos_editar_cannot_update_via_sync(): void
    {
        $respuesta = $this->actingAs($this->userSinEditar, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', [
                'operacion_id' => (string) Str::uuid(),
                'tipo' => 'actualizar',
                'producto_id' => $this->productoA->id,
                'base_version' => $this->productoA->updated_at->toIso8601String(),
                'payload' => ['nombre' => 'No debería aplicarse'],
            ]);

        $respuesta->assertForbidden();
        $this->assertDatabaseMissing('productos', ['nombre' => 'No debería aplicarse']);
    }

    public function test_company_b_cannot_update_a_product_belonging_to_company_a(): void
    {
        $respuesta = $this->actingAs($this->userEmpresaB, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', [
                'operacion_id' => (string) Str::uuid(),
                'tipo' => 'actualizar',
                'producto_id' => $this->productoA->id,
                'base_version' => $this->productoA->updated_at->toIso8601String(),
                'payload' => ['nombre' => 'Secuestrado por Empresa B'],
            ]);

        $respuesta->assertNotFound();
        $this->assertDatabaseMissing('productos', ['nombre' => 'Secuestrado por Empresa B']);
    }

    public function test_company_b_creating_via_sync_only_creates_the_product_under_its_own_company(): void
    {
        $respuesta = $this->actingAs($this->userEmpresaB, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', [
                'operacion_id' => (string) Str::uuid(),
                'tipo' => 'crear',
                'payload' => ['nombre' => 'Producto de Empresa B'],
            ]);

        $respuesta->assertOk();
        $this->assertDatabaseHas('productos', ['nombre' => 'Producto de Empresa B', 'empresa_id' => $this->empresaB->id]);
    }

    public function test_stock_actual_sent_in_the_payload_is_rejected_not_silently_ignored(): void
    {
        $respuesta = $this->actingAs($this->userConPermisos, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', [
                'operacion_id' => (string) Str::uuid(),
                'tipo' => 'crear',
                'payload' => ['nombre' => 'Con stock forjado', 'stock_actual' => 999],
            ]);

        // stock_actual está 'prohibited' en StoreProductoRequest — la misma
        // validación reusada acá lo rechaza con 422, nunca lo aplica.
        $respuesta->assertStatus(422);
        $this->assertDatabaseMissing('productos', ['nombre' => 'Con stock forjado']);
    }

    public function test_updating_a_nonexistent_product_returns_not_found(): void
    {
        $respuesta = $this->actingAs($this->userConPermisos, 'api')
            ->postJson('/api/v1/contingencia/productos/sincronizar', [
                'operacion_id' => (string) Str::uuid(),
                'tipo' => 'actualizar',
                'producto_id' => 999999,
                'base_version' => now()->toIso8601String(),
                'payload' => ['nombre' => 'No existe'],
            ]);

        $respuesta->assertNotFound();
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $respuesta = $this->postJson('/api/v1/contingencia/productos/sincronizar', [
            'operacion_id' => (string) Str::uuid(),
            'tipo' => 'crear',
            'payload' => ['nombre' => 'Sin sesión'],
        ]);

        $respuesta->assertUnauthorized();
    }
}
