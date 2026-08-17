<?php

namespace Tests\Unit\Security;

use App\Enums\TipoMovimiento;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Models\Categoria;
use App\Models\CapturaIA;
use App\Models\Empresa;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\Role;
use App\Models\User;
use App\Policies\CapturaIAPolicy;
use App\Policies\MovimientoPolicy;
use App\Policies\ProductoPolicy;
use App\Services\InventoryService;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * ADR-019: reemplaza `EmpresaScopeTest` — no existe más una clase
 * `EmpresaScope` que probar. Esta suite cubre dos cosas, deliberadamente
 * distintas:
 *
 * 1. `FiltersByEmpresa` (el reemplazo explícito, no automático) filtra y
 *    falla-cerrado correctamente — probado aquí directamente sobre el
 *    trait. Una consulta Eloquent cruda (`Producto::all()`, `::find()`)
 *    YA NO se filtra sola, por diseño (ver ADR-019, sección "Riesgos") —
 *    de-probar esa vieja garantía sería afirmar algo falso.
 * 2. Las Policies siguen siendo la segunda capa de defensa, independiente
 *    de si la query que resolvió el modelo estaba filtrada — esto sigue
 *    siendo válido y crítico con o sin filtrado automático.
 *
 * El aislamiento real de cada endpoint HTTP sigue cubierto exhaustivamente
 * en `Feature/Security/CompanyIsolationHttpTest.php`; esta suite es Unit,
 * más rápida, para los casos que no necesitan el ciclo HTTP completo.
 * `Role`/`AuditLog`/etc. no se repiten aquí porque `FiltersByEmpresa` es
 * genérico sobre cualquier modelo — probarlo una vez (con `Producto`)
 * cubre el mecanismo; el resto de los módulos ya prueban su propio
 * aislamiento a nivel HTTP en su respectivo `*ControllerTest`.
 */
class CompanyIsolationEloquentTest extends TestCase
{
    use RefreshDatabase;
    use FiltersByEmpresa;

    private Empresa $empresaA;

    private Empresa $empresaB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
    }

    private function crearProductoParaEmpresaB(): Producto
    {
        return Producto::create(['nombre' => 'Producto de B', 'marca' => 'MarcaB', 'empresa_id' => $this->empresaB->id]);
    }

    /**
     * @param array<int, string> $permisos
     */
    private function otorgarPermisos(User $user, array $permisos): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($user->empresa_id);
        $rol = Role::create(['name' => 'Test '.uniqid(), 'guard_name' => 'api', 'empresa_id' => $user->empresa_id]);
        $rol->givePermissionTo($permisos);
        $user->assignRole($rol);
        $registrar->forgetCachedPermissions();
    }

    // --- FiltersByEmpresa: el mecanismo real de aislamiento (ADR-019) ---

    // "Company A requests a Product [id] from Company B" + "sequential IDs".
    public function test_resolver_para_empresa_actual_treats_another_companys_id_as_not_found(): void
    {
        $productoB = $this->crearProductoParaEmpresaB();
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->actingAs($userA, 'api');

        $this->expectException(ModelNotFoundException::class);
        $this->resolverParaEmpresaActual(Producto::class, $productoB->id);
    }

    public function test_para_empresa_actual_never_leaks_another_companys_products(): void
    {
        $this->crearProductoParaEmpresaB();
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        Producto::create(['nombre' => 'Producto de A', 'empresa_id' => $this->empresaA->id]);

        $this->actingAs($userA, 'api');
        $todos = $this->paraEmpresaActual(Producto::query())->get();

        $this->assertCount(1, $todos);
        $this->assertSame('Producto de A', $todos->first()->nombre);
    }

    // "Company A attempts mass-assignment of empresa_id" / "manipulates request payloads".
    public function test_mass_assigning_empresa_id_on_create_is_overridden_by_the_authenticated_user(): void
    {
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->actingAs($userA, 'api');

        $producto = Producto::create([
            'nombre' => 'Intento de fuga',
            'empresa_id' => $this->empresaB->id, // forjado
        ]);

        $this->assertSame($this->empresaA->id, $producto->empresa_id);
    }

    // Platform Super Admin: sin filtro, por diseño (ADR-008/009/019).
    public function test_a_platform_admin_sees_every_companys_products_via_filters_by_empresa(): void
    {
        $this->crearProductoParaEmpresaB();
        Producto::create(['nombre' => 'Producto de A', 'empresa_id' => $this->empresaA->id]);
        $admin = User::factory()->create(['empresa_id' => null, 'is_platform_admin' => true]);

        $this->actingAs($admin, 'api');

        $this->assertCount(2, $this->paraEmpresaActual(Producto::query())->get());
    }

    // Fail-closed: sin usuario autenticado resuelto, cero filas — nunca todas.
    public function test_without_any_authenticated_user_para_empresa_actual_returns_zero_rows_not_all_rows(): void
    {
        $this->crearProductoParaEmpresaB();

        $this->assertCount(0, $this->paraEmpresaActual(Producto::query())->get());
    }

    // --- Policies: segunda capa de defensa, independiente del filtrado de la query ---

    // "Even without automatic filtering, Policies must still reject access" — defensa en profundidad.
    public function test_the_policy_still_denies_access_to_an_unfiltered_query_result(): void
    {
        $productoB = $this->crearProductoParaEmpresaB();
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        // Sin filtrado automático (ADR-019), esto es simplemente lo que
        // devuelve una consulta explícita sin filtrar — no hay Global
        // Scope que "bypasear". La Policy es la que debe rechazarlo.
        $productoB = Producto::find($productoB->id);

        $policy = new ProductoPolicy();
        $this->assertFalse($policy->view($userA, $productoB));
        $this->assertFalse($policy->update($userA, $productoB));
        $this->assertFalse($policy->delete($userA, $productoB));
    }

    public function test_the_policy_allows_access_to_ones_own_companys_product(): void
    {
        $productoA = Producto::create(['nombre' => 'Producto de A', 'empresa_id' => $this->empresaA->id]);
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->otorgarPermisos($userA, ['productos.ver', 'productos.editar', 'productos.gestionar']);

        $policy = new ProductoPolicy();
        $this->assertTrue($policy->view($userA, $productoA));
        $this->assertTrue($policy->update($userA, $productoA));
        $this->assertTrue($policy->delete($userA, $productoA));
    }

    public function test_movimiento_policy_denies_cross_company_access_to_an_unfiltered_query_result(): void
    {
        $productoB = $this->crearProductoParaEmpresaB();
        $movimientoB = (new InventoryService())->registrarMovimiento($productoB, TipoMovimiento::Entrada, 10);
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $movimientoB = Movimiento::find($movimientoB->id);

        $policy = new MovimientoPolicy();
        $this->assertFalse($policy->view($userA, $movimientoB));
        $this->assertFalse($policy->delete($userA, $movimientoB));
    }

    public function test_captura_ia_policy_denies_cross_company_access(): void
    {
        $userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $this->otorgarPermisos($userB, ['captura-ia.usar']);

        $capturaB = new CapturaIA(['empresa_id' => $this->empresaB->id]);

        $policy = new CapturaIAPolicy();
        $this->assertFalse($policy->view($userA, $capturaB));
        $this->assertTrue($policy->view($userB, $capturaB));
    }

    // --- Relaciones: seguras por integridad referencial (FK), no por scope ---

    // "Company A uses relationships" — traversal desde Categoria.
    public function test_relationship_traversal_from_categoria_never_leaks_another_companys_products(): void
    {
        $categoriaB = Categoria::create(['nombre' => 'Alimento', 'empresa_id' => $this->empresaB->id]);
        Producto::create(['nombre' => 'Producto de B', 'categoria_id' => $categoriaB->id, 'empresa_id' => $this->empresaB->id]);

        $categoriaA = Categoria::create(['nombre' => 'Alimento', 'empresa_id' => $this->empresaA->id]);
        Producto::create(['nombre' => 'Producto de A', 'categoria_id' => $categoriaA->id, 'empresa_id' => $this->empresaA->id]);

        // Aísla por FK (categoria_id), no por ningún scope — un producto
        // solo aparece aquí si su categoria_id es literalmente este.
        $this->assertCount(1, $categoriaA->productos);
        $this->assertSame('Producto de A', $categoriaA->productos->first()->nombre);
    }

    public function test_relationship_traversal_from_empresa_never_leaks_another_companys_products(): void
    {
        $this->crearProductoParaEmpresaB();
        Producto::create(['nombre' => 'Producto de A', 'empresa_id' => $this->empresaA->id]);

        // hasMany() ya acota por empresa_id vía su propia FK — nunca
        // dependió de un Global Scope.
        $this->assertCount(1, $this->empresaA->productos()->get());
    }

    // --- Seeders: el mismo aislamiento aplica al sembrar datos demo (ADR-019) ---

    // Regresión real encontrada en esta misma auditoría: sin EmpresaScope,
    // el firstOrCreate(['name' => ..., 'guard_name' => 'api']) de
    // RoleSeeder (sin empresa_id en el criterio) encontraba el rol ya
    // creado para la primera empresa al sembrar la segunda, y se lo
    // reasignaba — RoleSeeder::crear() ahora incluye empresa_id en el
    // criterio de búsqueda, no solo en la asignación posterior.
    public function test_seeding_roles_for_a_second_company_never_steals_the_first_companys_role(): void
    {
        $rolesA = (new RoleSeeder())->crear($this->empresaA);
        $rolesB = (new RoleSeeder())->crear($this->empresaB);

        $adminA = $rolesA['Administrador'];
        $adminB = $rolesB['Administrador'];

        $this->assertNotSame($adminA->id, $adminB->id);
        $this->assertSame($this->empresaA->id, $adminA->fresh()->empresa_id);
        $this->assertSame($this->empresaB->id, $adminB->fresh()->empresa_id);
    }
}
