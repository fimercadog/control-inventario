<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Categoria;
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
 * aislamiento por empresa sobre su propio producto, que necesita pasar
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

        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Proveedores A', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolA->givePermissionTo(['proveedores.ver', 'proveedores.crear', 'proveedores.editar', 'proveedores.gestionar', 'productos.ver', 'productos.editar']);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();

        $registrar->setPermissionsTeamId($this->empresaB->id);
        $rolB = Role::create(['name' => 'Test Proveedores B', 'guard_name' => 'api', 'empresa_id' => $this->empresaB->id]);
        $rolB->givePermissionTo(['productos.ver', 'productos.editar']);
        $this->userB->assignRole($rolB);
        $registrar->forgetCachedPermissions();

        $registrar->setPermissionsTeamId($this->empresaA->id);
        $this->proveedorA = Proveedor::create(['nombre' => 'Distribuidora Central', 'nit' => '900123456', 'empresa_id' => $this->empresaA->id]);
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
        Proveedor::create(['nombre' => 'Otro Distinto', 'nit' => '111', 'empresa_id' => $this->empresaA->id]);

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
     * (contacto en este caso), no un `->only(['nombre','nit','estado'])`
     * fijo que lo omitiría en silencio — encontrado auditando el módulo.
     * Usa `contacto`, no `email`, porque `email` es un campo de identidad
     * inmutable desde ADR-015 (ver `test_email_and_nit_cannot_be_changed_on_update`).
     */
    public function test_updating_the_contacto_field_specifically_is_captured_in_the_audit_log(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['contacto' => 'Nuevo Contacto'])
            ->assertOk();

        $log = AuditLog::where('modulo', 'proveedores')->where('accion', 'proveedores.editar')->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertSame('Nuevo Contacto', $log->valores_nuevos['contacto'] ?? null);
        $this->assertArrayNotHasKey('updated_at', $log->valores_nuevos);
    }

    /**
     * `email`/`nit` son campos de identidad (ADR-015, modelo de identidad
     * ERP) — inmutables después de la creación, igual que `empresa_id`.
     * Se ignoran en silencio si se envían en el PATCH genérico.
     */
    public function test_email_and_nit_cannot_be_changed_on_update(): void
    {
        $emailOriginal = $this->proveedorA->email;
        $nitOriginal = $this->proveedorA->nit;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", [
                'email' => 'otro-email@empresa-a.test',
                'nit' => '999999999',
                'telefono' => '3005551111',
            ])
            ->assertOk();

        $this->assertSame($emailOriginal, $this->proveedorA->fresh()->email);
        $this->assertSame($nitOriginal, $this->proveedorA->fresh()->nit);
        $this->assertSame('3005551111', $this->proveedorA->fresh()->telefono);
    }

    /** Sin cambios reales (mismo valor reenviado), no debe escribirse un log de auditoría vacío. */
    public function test_updating_with_no_actual_field_changes_writes_no_audit_log(): void
    {
        $this->proveedorA->update(['telefono' => '3001112222']);
        $antes = AuditLog::count();

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['telefono' => '3001112222'])
            ->assertOk();

        $this->assertSame($antes, AuditLog::count());
    }

    /**
     * `estado` se excluyó deliberadamente de `UpdateProveedorRequest` —
     * debe cambiar únicamente vía /habilitar y /deshabilitar, que llevan
     * su propio permiso y acción de auditoría (auditoría de campos
     * editables, 2026-08-04). Si se envía en el PATCH genérico, se ignora
     * en silencio, mismo patrón que `empresa_id`.
     */
    public function test_estado_is_ignored_on_the_generic_update_endpoint(): void
    {
        $this->assertSame('activo', $this->proveedorA->fresh()->estado);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['estado' => 'inactivo', 'telefono' => '3005550000'])
            ->assertOk()
            ->assertJsonPath('data.estado', 'activo');

        $this->assertSame('activo', $this->proveedorA->fresh()->estado);
        $this->assertSame('3005550000', $this->proveedorA->fresh()->telefono);
    }

    /** `nombre` es el campo de identidad del registro — un PATCH no puede vaciarlo. */
    public function test_nombre_cannot_be_blanked_on_update(): void
    {
        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['nombre' => ''])
            ->assertStatus(422);

        $this->assertNotSame('', $this->proveedorA->fresh()->nombre);
    }

    /** `empresa_id` nunca está en las reglas de validación — protección estructural, no explícita, cubierta aquí como regresión. */
    public function test_empresa_id_cannot_be_changed_on_update(): void
    {
        $original = $this->proveedorA->empresa_id;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", ['empresa_id' => $this->empresaB->id])
            ->assertOk();

        $this->assertSame($original, $this->proveedorA->fresh()->empresa_id);
    }

    /**
     * Escenario explícito del Work Order de auditoría (2026-08-10): un
     * único PATCH intentando `id`/`empresa_id`/`email`/`nit`/`created_at`/
     * `updated_at` a la vez, junto a un campo operativo válido. `id` va en
     * la URL (route-model-binding), nunca en el payload — enviarlo no
     * tiene efecto por diseño de Eloquent, no por una regla de este
     * Request. `created_at`/`updated_at` nunca estuvieron en las reglas de
     * `UpdateProveedorRequest` (igual que `empresa_id`/`email`/`nit`, ya
     * cubiertos por tests dedicados) — consolidado aquí como regresión
     * explícita del payload exacto que pide el Work Order.
     */
    public function test_mass_assignment_of_all_identity_fields_is_rejected_in_a_single_request(): void
    {
        $original = $this->proveedorA->fresh();
        $createdAtOriginal = $original->created_at;

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/proveedores/{$this->proveedorA->id}", [
                'id' => 999999,
                'empresa_id' => $this->empresaB->id,
                'email' => 'atacante@evil.com',
                'nit' => 'NIT-MALICIOSO',
                'created_at' => '2000-01-01T00:00:00Z',
                'updated_at' => '2000-01-01T00:00:00Z',
                'nombre' => 'Nombre Válido Actualizado',
            ])
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Nombre Válido Actualizado');

        $actualizado = $this->proveedorA->fresh();
        $this->assertSame($this->proveedorA->id, $actualizado->id);
        $this->assertSame($this->empresaA->id, $actualizado->empresa_id);
        $this->assertSame($original->email, $actualizado->email);
        $this->assertSame($original->nit, $actualizado->nit);
        $this->assertTrue($createdAtOriginal->equalTo($actualizado->created_at));
        $this->assertSame('Nombre Válido Actualizado', $actualizado->nombre);
    }

    /**
     * Únicamente a la creación — `email` ya no es editable vía PATCH
     * (ADR-015), así que un conflicto de unicidad al editar es
     * estructuralmente imposible desde 2026-08-04, no solo rechazado.
     */
    public function test_two_suppliers_in_the_same_company_cannot_share_an_email(): void
    {
        Proveedor::create(['nombre' => 'Otro Proveedor', 'email' => 'duplicado@test.com', 'empresa_id' => $this->empresaA->id]);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/proveedores', ['nombre' => 'Tercer Proveedor', 'email' => 'duplicado@test.com'])
            ->assertStatus(422);
    }

    /**
     * El mismo email en OTRA empresa no es un conflicto — único por
     * empresa, no global. `$this->userB` de este archivo solo tiene
     * `productos.*` (fixture pensado para los casos negativos de
     * aislamiento por empresa) — se crea un actor dedicado con `proveedores.crear`
     * en Empresa B en vez de forzar el fixture compartido.
     */
    public function test_two_suppliers_in_different_companies_can_share_an_email(): void
    {
        Proveedor::create(['nombre' => 'Proveedor Empresa A', 'email' => 'compartido@test.com', 'empresa_id' => $this->empresaA->id]);

        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($this->empresaB->id);

        $creadorB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $rolCreadorB = Role::create(['name' => 'Test Proveedores B Crear', 'guard_name' => 'api', 'empresa_id' => $this->empresaB->id]);
        $rolCreadorB->givePermissionTo(['proveedores.ver', 'proveedores.crear']);
        $creadorB->assignRole($rolCreadorB);
        $registrar->forgetCachedPermissions();

        $this->actingAs($creadorB, 'api')
            ->postJson('/api/v1/proveedores', ['nombre' => 'Proveedor Empresa B', 'email' => 'compartido@test.com'])
            ->assertCreated();
    }

    /**
     * `nit` es Identity (ADR-015) y ahora único por empresa (riesgo
     * cerrado explícitamente por el propietario del proyecto, 2026-08-04).
     * `$this->proveedorA` ya tiene `nit = '900123456'` desde el fixture.
     */
    public function test_two_suppliers_in_the_same_company_cannot_share_a_nit(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/proveedores', ['nombre' => 'Otro Proveedor', 'nit' => '900123456'])
            ->assertStatus(422)
            ->assertJsonPath('errors.nit.0', 'Ya existe un proveedor con este NIT en tu empresa.');
    }

    /** El mismo NIT en OTRA empresa no es un conflicto — único por empresa, no global. */
    public function test_two_suppliers_in_different_companies_can_share_a_nit(): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($this->empresaB->id);

        $creadorB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $rolCreadorB = Role::create(['name' => 'Test Proveedores B Crear Nit', 'guard_name' => 'api', 'empresa_id' => $this->empresaB->id]);
        $rolCreadorB->givePermissionTo(['proveedores.ver', 'proveedores.crear']);
        $creadorB->assignRole($rolCreadorB);
        $registrar->forgetCachedPermissions();

        $this->actingAs($creadorB, 'api')
            ->postJson('/api/v1/proveedores', ['nombre' => 'Proveedor Empresa B', 'nit' => '900123456'])
            ->assertCreated();
    }

    /** Un `nit` nulo nunca cuenta como duplicado consigo mismo (NULL en un índice único). */
    public function test_two_suppliers_with_no_nit_are_not_a_conflict(): void
    {
        Proveedor::create(['nombre' => 'Proveedor Sin NIT 1', 'empresa_id' => $this->empresaA->id]);

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/proveedores', ['nombre' => 'Proveedor Sin NIT 2'])
            ->assertCreated();
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

    /**
     * Cierre de módulo (2026-08-11): el test de arriba cubre /deshabilitar
     * cruzado pero no /habilitar — mismo endpoint, mismo mecanismo
     * (resolverParaEmpresaActual), sin cobertura dedicada hasta ahora.
     */
    public function test_company_b_cannot_enable_company_as_supplier(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson("/api/v1/proveedores/{$this->proveedorA->id}/deshabilitar");

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/proveedores/{$this->proveedorA->id}/habilitar")
            ->assertNotFound();

        $this->assertSame('inactivo', $this->proveedorA->fresh()->estado);
    }

    /**
     * `ProductoProveedorControllerTest` ya cubre el aislamiento cruzado de
     * `/productos/{id}/proveedores/*` (gestión de asociaciones desde el
     * lado Producto); este endpoint (`GET /proveedores/{id}/productos`,
     * pestaña "Productos" de la Ficha de Proveedor) nunca tenía su propio
     * caso de aislamiento — encontrado auditando el módulo.
     */
    public function test_company_b_cannot_access_products_associated_with_company_as_supplier(): void
    {
        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/proveedores/{$this->proveedorA->id}/productos")
            ->assertNotFound();
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
        $categoria = Categoria::create(['nombre' => 'Test', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);
        $producto = Producto::create(['categoria_id' => $categoria->id, 'codigo' => 'P-001', 'nombre' => 'Producto Test', 'empresa_id' => $this->empresaA->id]);

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
        $categoria = Categoria::create(['nombre' => 'Test', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);
        $producto = Producto::create(['categoria_id' => $categoria->id, 'codigo' => 'P-002', 'nombre' => 'Producto Test 2', 'empresa_id' => $this->empresaA->id]);

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
        $categoria = Categoria::create(['nombre' => 'Test', 'estado' => 'activo', 'empresa_id' => $this->empresaA->id]);

        $producto = Producto::create(['categoria_id' => $categoria->id, 'codigo' => 'P-003', 'nombre' => 'Producto B', 'empresa_id' => $this->empresaB->id]);

        $this->actingAs($this->userB, 'api')
            ->postJson("/api/v1/productos/{$producto->id}/movimientos", [
                'cantidad' => 5,
                'proveedor_id' => $this->proveedorA->id,
            ])
            ->assertStatus(404);
    }
}
