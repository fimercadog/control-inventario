<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Marca;
use App\Models\MarcaProveedor;
use App\Models\Producto;
use App\Models\ProductoProveedor;
use App\Models\Proveedor;
use App\Models\Role;
use App\Models\UnidadMedida;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * WO "Modelo de base de datos" (2026-08-17). Cobertura directa de las
 * relaciones principales del modelo de negocio pedidas en la sección 17 del
 * Work Order — no repite lo que ya cubren ProductoControllerTest/
 * RoleControllerTest/CategoriaControllerTest/etc. (validaciones HTTP,
 * RBAC, permisos por endpoint), se enfoca solo en que las relaciones
 * Eloquent y las restricciones de integridad de la base real funcionen
 * como se espera.
 */
class DatabaseModelRelationshipsTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
    }

    public function test_a_product_can_have_several_suppliers(): void
    {
        $producto = Producto::factory()->create(['empresa_id' => $this->empresaA->id]);
        $proveedores = Proveedor::factory()->count(3)->create(['empresa_id' => $this->empresaA->id]);

        foreach ($proveedores as $proveedor) {
            ProductoProveedor::create([
                'empresa_id' => $this->empresaA->id,
                'producto_id' => $producto->id,
                'proveedor_id' => $proveedor->id,
            ]);
        }

        $this->assertCount(3, $producto->proveedores);
        $this->assertEqualsCanonicalizing(
            $proveedores->pluck('id')->all(),
            $producto->proveedores->pluck('id')->all(),
        );
    }

    public function test_a_supplier_can_have_several_products(): void
    {
        $proveedor = Proveedor::factory()->create(['empresa_id' => $this->empresaA->id]);
        $productos = Producto::factory()->count(3)->create(['empresa_id' => $this->empresaA->id]);

        foreach ($productos as $producto) {
            ProductoProveedor::create([
                'empresa_id' => $this->empresaA->id,
                'producto_id' => $producto->id,
                'proveedor_id' => $proveedor->id,
            ]);
        }

        $this->assertCount(3, $proveedor->productos);
    }

    public function test_a_brand_can_have_several_suppliers(): void
    {
        $marca = Marca::factory()->create(['empresa_id' => $this->empresaA->id]);
        $proveedores = Proveedor::factory()->count(3)->create(['empresa_id' => $this->empresaA->id]);

        foreach ($proveedores as $proveedor) {
            MarcaProveedor::create([
                'empresa_id' => $this->empresaA->id,
                'marca_id' => $marca->id,
                'proveedor_id' => $proveedor->id,
            ]);
        }

        $this->assertCount(3, $marca->proveedores);
    }

    public function test_a_supplier_can_have_several_brands(): void
    {
        $proveedor = Proveedor::factory()->create(['empresa_id' => $this->empresaA->id]);
        $marcas = Marca::factory()->count(3)->create(['empresa_id' => $this->empresaA->id]);

        foreach ($marcas as $marca) {
            MarcaProveedor::create([
                'empresa_id' => $this->empresaA->id,
                'marca_id' => $marca->id,
                'proveedor_id' => $proveedor->id,
            ]);
        }

        $this->assertCount(3, $proveedor->marcas);
    }

    /** marca_id/proveedor_id repetido para la misma pareja debe rechazarse (unique real de la BD). */
    public function test_a_brand_cannot_be_linked_to_the_same_supplier_twice(): void
    {
        $marca = Marca::factory()->create(['empresa_id' => $this->empresaA->id]);
        $proveedor = Proveedor::factory()->create(['empresa_id' => $this->empresaA->id]);

        MarcaProveedor::create(['empresa_id' => $this->empresaA->id, 'marca_id' => $marca->id, 'proveedor_id' => $proveedor->id]);

        $this->expectException(QueryException::class);
        MarcaProveedor::create(['empresa_id' => $this->empresaA->id, 'marca_id' => $marca->id, 'proveedor_id' => $proveedor->id]);
    }

    public function test_a_product_belongs_to_a_brand(): void
    {
        $marca = Marca::factory()->create(['empresa_id' => $this->empresaA->id]);
        $producto = Producto::factory()->create(['empresa_id' => $this->empresaA->id, 'marca_id' => $marca->id]);

        $this->assertTrue($producto->marca->is($marca));
    }

    public function test_a_product_belongs_to_a_category(): void
    {
        $categoria = Categoria::factory()->create(['empresa_id' => $this->empresaA->id]);
        $producto = Producto::factory()->create(['empresa_id' => $this->empresaA->id, 'categoria_id' => $categoria->id]);

        $this->assertTrue($producto->categoria->is($categoria));
    }

    public function test_a_product_belongs_to_a_unit_of_measure(): void
    {
        $unidad = UnidadMedida::factory()->create(['empresa_id' => $this->empresaA->id]);
        $producto = Producto::factory()->create(['empresa_id' => $this->empresaA->id, 'unidad_medida_id' => $unidad->id]);

        $this->assertTrue($producto->unidadMedida->is($unidad));
    }

    /**
     * "Un producto tiene un stock" — confirmado como decisión ya tomada del
     * proyecto (citada en StockController/StockResource/StockPolicy/routes):
     * Stock no es una tabla independiente, sus 4 campos viven directo en
     * `productos`. Esta prueba fija esa realidad, no una tabla `stock`
     * separada — ver informe del Work Order, sección "Stock".
     */
    public function test_a_product_has_stock_information_as_its_own_attributes(): void
    {
        $producto = Producto::factory()->create([
            'empresa_id' => $this->empresaA->id,
            'stock_minimo' => 10,
            'stock_maximo' => 200,
        ]);

        // ->fresh() a propósito: stock_actual/stock_estado nacen de defaults de
        // columna (nunca asignados en PHP en la creación), así que el objeto
        // en memoria devuelto por create() todavía los tiene en null — Eloquent
        // no relee la fila tras el INSERT. Sin el reload, (float) null castea
        // silenciosamente a 0.0 y esta prueba pasaría igual sin probar nada real.
        $producto = $producto->fresh();

        $this->assertSame(0.0, (float) $producto->stock_actual);
        $this->assertSame(10.0, (float) $producto->stock_minimo);
        $this->assertSame(200.0, (float) $producto->stock_maximo);
        $this->assertSame('activo', $producto->stock_estado);
    }

    /**
     * A nivel de esquema (model_has_roles, sin restricción que lo impida) un
     * usuario puede tener varios roles simultáneos — la relación N:M pedida
     * en el Work Order. La regla de negocio actual de la aplicación (un solo
     * rol activo por usuario vía syncRoles(), UserController::asignarRol())
     * es una decisión de producto ya confirmada y separada de esto: no la
     * cambia esta prueba, solo confirma que el modelo de datos subyacente sí
     * soporta la relación N:M pedida.
     */
    public function test_a_user_can_have_several_roles_at_the_schema_level(): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->empresaA->id);

        $usuario = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $rolUno = Role::create(['name' => 'Rol Uno', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolDos = Role::create(['name' => 'Rol Dos', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);

        $usuario->assignRole($rolUno);
        $usuario->assignRole($rolDos);

        $this->assertCount(2, $usuario->fresh()->roles);
    }

    public function test_a_role_can_have_several_users(): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->empresaA->id);

        $rol = Role::create(['name' => 'Rol Compartido', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $usuarios = User::factory()->count(3)->create(['empresa_id' => $this->empresaA->id]);

        foreach ($usuarios as $usuario) {
            $usuario->assignRole($rol);
        }

        $this->assertCount(3, $rol->usuarios);
    }

    public function test_a_role_can_have_several_permissions(): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->empresaA->id);

        $rol = Role::create(['name' => 'Rol Con Permisos', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rol->givePermissionTo(['categorias.ver', 'categorias.crear', 'categorias.editar']);

        $this->assertCount(3, $rol->fresh()->permissions);
    }

    /**
     * Empresa A no puede ver datos de Empresa B a través de ninguna de las
     * relaciones nuevas/existentes de Empresa — cada hasMany() filtra por
     * empresa_id porque la FK real así lo exige, no por un Global Scope
     * (ADR-019 los eliminó a propósito).
     */
    public function test_a_company_cannot_access_another_companys_data_through_empresa_relations(): void
    {
        User::factory()->create(['empresa_id' => $this->empresaA->id]);
        User::factory()->count(2)->create(['empresa_id' => $this->empresaB->id]);

        Marca::factory()->create(['empresa_id' => $this->empresaA->id]);
        Marca::factory()->count(2)->create(['empresa_id' => $this->empresaB->id]);

        UnidadMedida::factory()->create(['empresa_id' => $this->empresaA->id]);
        UnidadMedida::factory()->count(2)->create(['empresa_id' => $this->empresaB->id]);

        Proveedor::factory()->create(['empresa_id' => $this->empresaA->id]);
        Proveedor::factory()->count(2)->create(['empresa_id' => $this->empresaB->id]);

        $this->assertCount(1, $this->empresaA->users);
        $this->assertCount(1, $this->empresaA->marcas);
        $this->assertCount(1, $this->empresaA->unidadesMedida);
        $this->assertCount(1, $this->empresaA->proveedores);

        $this->assertCount(2, $this->empresaB->users);
        $this->assertCount(2, $this->empresaB->marcas);
        $this->assertCount(2, $this->empresaB->unidadesMedida);
        $this->assertCount(2, $this->empresaB->proveedores);
    }

    /** El pivote marca_proveedor también respeta el aislamiento por empresa. */
    public function test_marca_proveedor_association_cannot_cross_companies_via_the_belongs_to_empresa_hook(): void
    {
        $this->actingAs(User::factory()->create(['empresa_id' => $this->empresaA->id]), 'api');

        $marcaA = Marca::factory()->create(['empresa_id' => $this->empresaA->id]);
        $proveedorA = Proveedor::factory()->create(['empresa_id' => $this->empresaA->id]);

        $asociacion = MarcaProveedor::create([
            'marca_id' => $marcaA->id,
            'proveedor_id' => $proveedorA->id,
        ]);

        // BelongsToEmpresa fuerza empresa_id al de la empresa del usuario autenticado,
        // ignorando cualquier valor que hubiera llegado (o no) por mass-assignment.
        $this->assertSame($this->empresaA->id, $asociacion->fresh()->empresa_id);
    }
}
