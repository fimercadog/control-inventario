<?php

namespace Tests\Unit\Security;

use App\Enums\TipoMovimiento;
use App\Models\AuditLog;
use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\Role;
use App\Models\Scopes\TenantScope;
use App\Models\User;
use App\Policies\CapturaIAPolicy;
use App\Policies\MovimientoPolicy;
use App\Policies\ProductoPolicy;
use App\Services\Auth\TenantContext;
use App\Services\InventoryService;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Módulo 2 — Company Isolation. Aísla la prueba de la capa Eloquent/Policy
 * directamente, sin pasar por HTTP — cubre Producto/Movimiento (que hoy no
 * tienen endpoint REST propio) y los escenarios "un desarrollador se
 * olvidó del where/scope" que TenantScope existe para eliminar.
 */
class TenantScopeTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private TenantContext $context;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->context = app(TenantContext::class);
    }

    private function crearProductoParaEmpresaB(): Producto
    {
        $this->context->setEmpresaId($this->empresaB->id);

        return Producto::create(['nombre' => 'Producto de B', 'marca' => 'MarcaB']);
    }

    /**
     * Fase 4.6 (Authorization Completion): las Policies de este archivo ya
     * no dependen solo de `TenantScope`/pertenencia — también exigen el
     * permiso del recurso (docs/security/ROLES_MATRIX.md). Este helper
     * arma un rol de un solo uso en el team de `$user->empresa_id` para
     * los pocos tests de este archivo que necesitan probar el camino
     * "autorizado" en vez del camino "denegado" (que sigue funcionando
     * con cero permisos, porque la pertenencia por sí sola ya lo bloquea).
     *
     * Deliberadamente NO restaura el team id/contexto anterior: a
     * diferencia de los tests HTTP (donde `IdentifyTenant` lo vuelve a
     * fijar en cada request), aquí las aserciones que siguen a esta
     * llamada dependen de que el team siga siendo el de `$user` — Spatie
     * resuelve `model_has_roles` por team ACTIVO al momento del check, no
     * al momento de la asignación.
     *
     * @param array<int, string> $permisos
     */
    private function otorgarPermisos(User $user, array $permisos): void
    {
        $this->context->setEmpresaId($user->empresa_id);
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($user->empresa_id);
        $rol = Role::create(['name' => 'Test '.uniqid(), 'guard_name' => 'api']);
        $rol->givePermissionTo($permisos);
        $user->assignRole($rol);
        $registrar->forgetCachedPermissions();
    }

    // "Company A requests a Product [id] from Company B" + "sequential IDs".
    public function test_producto_find_returns_null_for_another_companys_sequential_id(): void
    {
        $productoB = $this->crearProductoParaEmpresaB();

        $this->context->setEmpresaId($this->empresaA->id);
        $this->assertNull(Producto::find($productoB->id));
    }

    // "Company A bypasses TenantScope through direct repository calls" —
    // simula un desarrollador que llama Eloquent crudo sin acordarse de filtrar.
    public function test_a_raw_eloquent_query_never_leaks_another_companys_products(): void
    {
        $this->crearProductoParaEmpresaB();

        $this->context->setEmpresaId($this->empresaA->id);
        Producto::create(['nombre' => 'Producto de A']);

        $todos = Producto::all();

        $this->assertCount(1, $todos);
        $this->assertSame('Producto de A', $todos->first()->nombre);
    }

    public function test_movimiento_find_returns_null_for_another_companys_id(): void
    {
        $productoB = $this->crearProductoParaEmpresaB();
        $movimientoB = (new InventoryService())->registrarMovimiento($productoB, TipoMovimiento::Entrada, 10);

        $this->context->setEmpresaId($this->empresaA->id);
        $this->assertNull(Movimiento::find($movimientoB->id));
    }

    // "Company A attempts mass-assignment of empresa_id" / "manipulates request payloads".
    public function test_mass_assigning_empresa_id_on_create_is_overridden_by_the_tenant_context(): void
    {
        $this->context->setEmpresaId($this->empresaA->id);

        $producto = Producto::create([
            'nombre' => 'Intento de fuga',
            'empresa_id' => $this->empresaB->id, // forjado
        ]);

        $this->assertSame($this->empresaA->id, $producto->empresa_id);
    }

    // "Even if TenantScope is bypassed, Policies must reject access" — defensa en profundidad.
    public function test_the_policy_still_denies_access_even_if_the_scope_is_explicitly_bypassed(): void
    {
        $productoB = $this->crearProductoParaEmpresaB();
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        // Un desarrollador que bypasea el scope a mano (withoutGlobalScope)
        // igual no debe poder actuar sobre el registro: la Policy es la
        // segunda capa, independiente del scope.
        $productoB = Producto::withoutGlobalScope(TenantScope::class)->find($productoB->id);

        $policy = new ProductoPolicy();
        $this->assertFalse($policy->view($userA, $productoB));
        $this->assertFalse($policy->update($userA, $productoB));
        $this->assertFalse($policy->delete($userA, $productoB));
    }

    public function test_the_policy_allows_access_to_ones_own_companys_product(): void
    {
        $this->context->setEmpresaId($this->empresaA->id);
        $productoA = Producto::create(['nombre' => 'Producto de A']);
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->otorgarPermisos($userA, ['productos.ver', 'productos.editar', 'productos.gestionar']);

        $policy = new ProductoPolicy();
        $this->assertTrue($policy->view($userA, $productoA));
        $this->assertTrue($policy->update($userA, $productoA));
        $this->assertTrue($policy->delete($userA, $productoA));
    }

    public function test_movimiento_policy_denies_cross_company_access_even_with_the_scope_bypassed(): void
    {
        $productoB = $this->crearProductoParaEmpresaB();
        $movimientoB = (new InventoryService())->registrarMovimiento($productoB, TipoMovimiento::Entrada, 10);
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $movimientoB = Movimiento::withoutGlobalScope(TenantScope::class)->find($movimientoB->id);

        $policy = new MovimientoPolicy();
        $this->assertFalse($policy->view($userA, $movimientoB));
        $this->assertFalse($policy->delete($userA, $movimientoB));
    }

    // Platform Super Admin: bypassea TenantScope por diseño (docs/04_ARCHITECTURE.md).
    public function test_a_platform_admin_bypasses_tenant_scope_and_sees_every_companys_products(): void
    {
        $this->crearProductoParaEmpresaB();
        $this->context->setEmpresaId($this->empresaA->id);
        Producto::create(['nombre' => 'Producto de A']);

        $this->context->bypass();

        $this->assertCount(2, Producto::all());
    }

    // "Company A uses eager loading" — la relación cargada tampoco debe filtrarse mal.
    public function test_eager_loading_a_relation_never_leaks_another_companys_rows(): void
    {
        $productoB = $this->crearProductoParaEmpresaB();
        (new InventoryService())->registrarMovimiento($productoB, TipoMovimiento::Entrada, 10);

        $this->context->setEmpresaId($this->empresaA->id);
        $productoA = Producto::create(['nombre' => 'Producto de A']);
        (new InventoryService())->registrarMovimiento($productoA, TipoMovimiento::Entrada, 5);

        $movimientosConProducto = Movimiento::with('producto')->get();

        $this->assertCount(1, $movimientosConProducto);
        $this->assertSame('Producto de A', $movimientosConProducto->first()->producto->nombre);
    }

    // "Company A uses relationships" — traversal desde Categoria/Empresa.
    public function test_relationship_traversal_from_categoria_never_leaks_another_companys_products(): void
    {
        $this->context->setEmpresaId($this->empresaB->id);
        $categoriaB = Categoria::create(['nombre' => 'Alimento']);
        Producto::create(['nombre' => 'Producto de B', 'categoria_id' => $categoriaB->id]);

        $this->context->setEmpresaId($this->empresaA->id);
        $categoriaA = Categoria::create(['nombre' => 'Alimento']);
        Producto::create(['nombre' => 'Producto de A', 'categoria_id' => $categoriaA->id]);

        $this->assertCount(1, $categoriaA->productos);
        $this->assertSame('Producto de A', $categoriaA->productos->first()->nombre);
    }

    public function test_relationship_traversal_from_empresa_never_leaks_another_companys_products(): void
    {
        $this->crearProductoParaEmpresaB();
        $this->context->setEmpresaId($this->empresaA->id);
        Producto::create(['nombre' => 'Producto de A']);

        // Empresa no es empresa-owned (es la raíz del tenant), su relación
        // hasMany sí debe respetar TenantScope del lado de Producto.
        $this->assertCount(1, $this->empresaA->productos()->get());
    }

    // "Company A uses nested resources" a nivel de detalle de captura ya se
    // cubre en Feature/Security/CompanyIsolationHttpTest; aquí se cubre el
    // caso de Role (Módulo 0/1), con la misma disciplina de aislamiento.
    public function test_role_find_returns_null_for_another_companys_role_id(): void
    {
        $this->context->setEmpresaId($this->empresaB->id);
        $roleB = Role::create(['name' => 'Rol de B', 'guard_name' => 'api']);

        $this->context->setEmpresaId($this->empresaA->id);
        $this->assertNull(Role::find($roleB->id));
    }

    // AuditLog: inmutable y empresa-owned — el aislamiento aplica igual.
    public function test_audit_log_query_never_leaks_another_companys_entries(): void
    {
        $this->context->setEmpresaId($this->empresaB->id);
        AuditLog::create([
            'modulo' => 'test', 'accion' => 'crear', 'auditable_type' => Producto::class,
            'auditable_id' => 1, 'resultado' => 'exito',
        ]);

        $this->context->setEmpresaId($this->empresaA->id);
        $this->assertCount(0, AuditLog::all());
    }

    // Fail-closed: sin contexto resuelto (ni explícito ni guard autenticado), cero filas — nunca todas.
    public function test_without_any_tenant_context_queries_return_zero_rows_not_all_rows(): void
    {
        $this->crearProductoParaEmpresaB();

        // $this->context ya quedó "explícitamente fijado" por el helper de
        // arriba (setEmpresaId es permanente en esa instancia) — para
        // probar el estado realmente prístino (nunca tocado, como al
        // arrancar una request antes de que IdentifyTenant corra), se
        // fuerza una instancia nueva de TenantContext en el contenedor.
        $this->app->forgetInstance(TenantContext::class);
        $contextoPristino = app(TenantContext::class);

        $this->assertNull($contextoPristino->empresaId());
        $this->assertCount(0, Producto::all());
    }

    public function test_captura_ia_policy_denies_cross_company_access(): void
    {
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $this->otorgarPermisos($userB, ['captura-ia.usar']);

        $capturaB = new \App\Models\CapturaIA(['empresa_id' => $this->empresaB->id]);

        $policy = new CapturaIAPolicy();
        $this->assertFalse($policy->view($userA, $capturaB));
        $this->assertTrue($policy->view($userB, $capturaB));
    }
}
