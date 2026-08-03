<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Borrado siempre
 * lógico (GLOBAL RULE, sesión 2026-07-29) — nunca un DELETE físico.
 *
 * Fase 4.5 (Authorization Alignment): `userA` tiene las 4 proveedores.* —
 * cubre los casos de "usuario autorizado". `userSinPermiso` es de la
 * misma empresa pero sin permisos de `proveedores.*` — prueba 403.
 *
 * Fase 4.6 (Authorization Completion): los tests de Registrar Ingreso
 * (`POST /productos/{id}/movimientos`) autorizan contra `ProductoPolicy`,
 * que esta fase cerró — `userA` y `userB` reciben también
 * `productos.ver`/`productos.editar` (userB solo para el test de
 * aislamiento cross-tenant sobre su propio producto, que necesita pasar
 * esa primera capa para llegar a la validación real bajo prueba).
 */
class ProveedorControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private User $userSinPermiso;

    private Proveedor $proveedorA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $registrar = app(PermissionRegistrar::class);
        $context = app(TenantContext::class);

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Proveedores A', 'guard_name' => 'api']);
        $rolA->givePermissionTo(['proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.gestionar', 'productos.ver', 'productos.editar']);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaB->id);
        $registrar->setPermissionsTeamId($this->empresaB->id);
        $rolB = Role::create(['name' => 'Test Proveedores B', 'guard_name' => 'api']);
        $rolB->givePermissionTo(['productos.ver', 'productos.editar']);
        $this->userB->assignRole($rolB);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
        $this->proveedorA = Proveedor::create(['nombre' => 'Distribuidora Central', 'nit' => '900123456']);
    }

    public function test_a_user_can_create_a_supplier(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/proveedores', [
                'nombre' => 'Proveedor Nuevo SAS',
                'nit' => '900999999',
                'contacto' => 'Juan Pérez',
                'telefono' => '3001234567',
                'email' => 'contacto@proveedornuevo.com',
                'ciudad' => 'Bogotá',
                'pais' => 'Colombia',
            ])
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'Proveedor Nuevo SAS')
            ->assertJsonPath('data.estado', 'activo');

        $this->assertDatabaseHas('proveedores', ['nombre' => 'Proveedor Nuevo SAS', 'empresa_id' => $this->empresaA->id]);
    }

    public function test_creating_a_supplier_writes_a_real_audit_log_entry(): void
    {
        $response = $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/proveedores', ['nombre' => 'Proveedor Auditado']);

        $this->assertDatabaseHas('audit_logs', [
            'empresa_id' => $this->empresaA->id,
            'modulo' => 'proveedores',
            'accion' => 'proveedores.crear',
            'auditable_id' => $response->json('data.id'),
        ]);
    }

    public function test_a_user_can_view_and_list_their_own_companys_suppliers(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/proveedores/{$this->proveedorA->id}")
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Distribuidora Central');

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/proveedores')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_search_filters_by_nombre_nit_or_contacto(): void
    {
        app(TenantContext::class)->setEmpresaId($this->empresaA->id);
        Proveedor::create(['nombre' => 'Otro Distinto', 'nit' => '111']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/proveedores?busqueda=Central')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.nombre', 'Distribuidora Central');
    }

    public function test_updating_a_supplier_persists_and_writes_audit(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['telefono' => '3009999999'])
            ->assertOk()
            ->assertJsonPath('data.telefono', '3009999999');

        $this->assertSame('3009999999', $this->proveedorA->fresh()->telefono);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'proveedores', 'accion' => 'proveedores.editar']);
    }

    /**
     * El snapshot de auditoría debe reflejar el campo real que cambió
     * (email en este caso), no un `->only(['nombre','nit','estado'])` fijo
     * que lo omitiría en silencio — encontrado auditando el módulo.
     */
    public function test_updating_the_email_field_specifically_is_captured_in_the_audit_log(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['email' => 'nuevo@empresa-a.test'])
            ->assertOk();

        $log = \App\Models\AuditLog::where('modulo', 'proveedores')->where('accion', 'proveedores.editar')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertSame('nuevo@empresa-a.test', $log->valores_nuevos['email'] ?? null);
        $this->assertArrayNotHasKey('updated_at', $log->valores_nuevos);
    }

    /** Sin cambios reales (mismo valor reenviado), no debe escribirse un log de auditoría vacío. */
    public function test_updating_with_no_actual_field_changes_writes_no_audit_log(): void
    {
        $this->proveedorA->update(['telefono' => '3001112222']);
        $antes = \App\Models\AuditLog::count();

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['telefono' => '3001112222'])
            ->assertOk();

        $this->assertSame($antes, \App\Models\AuditLog::count());
    }

    public function test_two_suppliers_in_the_same_company_cannot_share_an_email(): void
    {
        Proveedor::create(['nombre' => 'Otro Proveedor', 'email' => 'duplicado@test.com']);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/proveedores', ['nombre' => 'Tercer Proveedor', 'email' => 'duplicado@test.com'])
            ->assertStatus(422);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['email' => 'duplicado@test.com'])
            ->assertStatus(422);
    }

    /**
     * El mismo email en OTRA empresa no es un conflicto — único por
     * empresa, no global. `$this->userB` de este archivo solo tiene
     * `productos.*` (fixture pensado para los casos negativos de
     * cross-tenant) — se crea un actor dedicado con `proveedores.crear`
     * en Empresa B en vez de forzar el fixture compartido.
     */
    public function test_two_suppliers_in_different_companies_can_share_an_email(): void
    {
        Proveedor::create(['nombre' => 'Proveedor Empresa A', 'email' => 'compartido@test.com']);

        $registrar = app(PermissionRegistrar::class);
        $context = app(TenantContext::class);
        $context->setEmpresaId($this->empresaB->id);
        $registrar->setPermissionsTeamId($this->empresaB->id);

        $creadorB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $rolCreadorB = Role::create(['name' => 'Test Proveedores B Crear', 'guard_name' => 'api']);
        $rolCreadorB->givePermissionTo(['proveedores.ver', 'proveedores.crear']);
        $creadorB->assignRole($rolCreadorB);
        $registrar->forgetCachedPermissions();

        $context->setEmpresaId($this->empresaB->id);
        $registrar->setPermissionsTeamId($this->empresaB->id);

        $this->actingAs($creadorB, 'api')
            ->postJson('/api/v1/proveedores', ['nombre' => 'Proveedor Empresa B', 'email' => 'compartido@test.com'])
            ->assertCreated();
    }

    /** Reenviar el mismo email sin cambiarlo nunca debe contar como conflicto consigo mismo. */
    public function test_updating_a_supplier_without_changing_its_own_email_does_not_conflict_with_itself(): void
    {
        $this->proveedorA->update(['email' => 'propio@test.com']);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", [
                'email' => 'propio@test.com',
                'telefono' => '3005551234',
            ])
            ->assertOk();
    }

    public function test_disabling_a_supplier_is_logical_never_physical(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/proveedores/{$this->proveedorA->id}/deshabilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'inactivo');

        // La fila sigue existiendo — nunca un DELETE físico.
        $this->assertDatabaseHas('proveedores', ['id' => $this->proveedorA->id, 'estado' => 'inactivo']);
        $this->assertDatabaseHas('audit_logs', ['modulo' => 'proveedores', 'accion' => 'proveedores.deshabilitar']);
    }

    public function test_disabled_supplier_is_hidden_from_default_listing_but_visible_via_filter(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/proveedores/{$this->proveedorA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/proveedores')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/proveedores?estado=todos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_a_disabled_supplier_can_be_re_enabled(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/proveedores/{$this->proveedorA->id}/deshabilitar");

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/proveedores/{$this->proveedorA->id}/habilitar")
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');
    }

    public function test_company_b_cannot_view_update_or_disable_company_as_supplier(): void
    {
        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/proveedores/{$this->proveedorA->id}")
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['nombre' => 'Hackeado'])
            ->assertNotFound();

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/proveedores/{$this->proveedorA->id}/deshabilitar")
            ->assertNotFound();

        $this->assertNotSame('Hackeado', $this->proveedorA->fresh()->nombre);
        $this->assertSame('activo', $this->proveedorA->fresh()->estado);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/proveedores')->assertUnauthorized();
    }

    public function test_a_same_company_user_without_permission_is_rejected_with_403(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/proveedores')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/proveedores/{$this->proveedorA->id}")
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson('/api/v1/proveedores', ['nombre' => 'Sin permiso'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['nombre' => 'Hackeado'])
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->postJson("/api/v1/proveedores/{$this->proveedorA->id}/deshabilitar")
            ->assertStatus(403);

        $this->assertDatabaseMissing('proveedores', ['nombre' => 'Sin permiso']);
        $this->assertNotSame('Hackeado', $this->proveedorA->fresh()->nombre);
        $this->assertSame('activo', $this->proveedorA->fresh()->estado);
    }

    // Integración con Registrar Ingreso Manual (FEATURE-002 + FEATURE-003)

    public function test_registrar_ingreso_accepts_an_existing_supplier_by_id(): void
    {
        $categoria = \App\Models\Categoria::create(['nombre' => 'Test', 'estado' => 'activo']);
        $producto = Producto::create(['categoria_id' => $categoria->id, 'codigo' => 'P-001', 'nombre' => 'Producto Test']);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$producto->id}/movimientos", [
                'cantidad' => 10,
                'proveedor_id' => $this->proveedorA->id,
            ])
            ->assertCreated();

        $movimiento = Movimiento::where('producto_id', $producto->id)->latest()->firstOrFail();
        $this->assertSame($this->proveedorA->id, $movimiento->proveedor_id);
        $this->assertSame('Distribuidora Central', $movimiento->proveedor);
    }

    public function test_registrar_ingreso_can_quick_create_a_new_supplier(): void
    {
        $categoria = \App\Models\Categoria::create(['nombre' => 'Test', 'estado' => 'activo']);
        $producto = Producto::create(['categoria_id' => $categoria->id, 'codigo' => 'P-002', 'nombre' => 'Producto Test 2']);

        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/productos/{$producto->id}/movimientos", [
                'cantidad' => 5,
                'proveedor_nuevo' => 'Proveedor Creado al Vuelo',
            ])
            ->assertCreated();

        $nuevoProveedor = Proveedor::where('nombre', 'Proveedor Creado al Vuelo')->firstOrFail();
        $this->assertSame($this->empresaA->id, $nuevoProveedor->empresa_id);

        $movimiento = Movimiento::where('producto_id', $producto->id)->latest()->firstOrFail();
        $this->assertSame($nuevoProveedor->id, $movimiento->proveedor_id);

        $this->assertDatabaseHas('audit_logs', ['modulo' => 'proveedores', 'accion' => 'proveedores.crear_rapido']);
    }

    public function test_company_b_cannot_use_company_as_supplier_id_in_registrar_ingreso(): void
    {
        $categoria = \App\Models\Categoria::create(['nombre' => 'Test', 'estado' => 'activo']);

        app(TenantContext::class)->setEmpresaId($this->empresaB->id);
        $producto = Producto::create(['categoria_id' => $categoria->id, 'codigo' => 'P-003', 'nombre' => 'Producto B']);

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/productos/{$producto->id}/movimientos", [
                'cantidad' => 5,
                'proveedor_id' => $this->proveedorA->id,
            ])
            ->assertStatus(404);
    }
}
