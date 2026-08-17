<?php

namespace Tests\Unit\Auth;

use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Valida el mecanismo de Teams de Spatie configurado con
 * team_foreign_key = empresa_id (docs/04_ARCHITECTURE.md, "Roles por
 * empresa"): un rol otorgado en el contexto de una empresa nunca debe
 * ser visible para el mismo usuario bajo el contexto de otra empresa.
 */
class RbacFoundationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);
    }

    public function test_the_permission_catalog_is_seeded_globally(): void
    {
        $this->assertTrue(Permission::where('name', 'productos.editar')->exists());
        $this->assertTrue(Permission::where('name', 'roles.gestionar')->exists());
        $this->assertTrue(Permission::where('name', 'plataforma.empresas.ver')->exists());
    }

    public function test_a_role_granted_in_one_empresa_does_not_leak_into_another(): void
    {
        $empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $user = User::factory()->create(['empresa_id' => $empresaA->id]);

        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($empresaA->id);
        $role = Role::create(['name' => 'Bodeguero', 'guard_name' => 'api', 'empresa_id' => $empresaA->id]);
        $role->givePermissionTo('productos.ver');
        $user->assignRole($role);

        $registrar->forgetCachedPermissions();
        $this->assertTrue($user->fresh()->can('productos.ver'));

        // Mismo usuario, contexto de otra empresa: el permiso no debe existir ahí.
        $registrar->setPermissionsTeamId($empresaB->id);
        $registrar->forgetCachedPermissions();
        $this->assertFalse($user->fresh()->can('productos.ver'));
    }

    public function test_roles_with_the_same_name_can_exist_independently_per_empresa(): void
    {
        $empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $empresaB = Empresa::create(['nombre' => 'Empresa B']);

        Role::create(['name' => 'Supervisor', 'guard_name' => 'api', 'empresa_id' => $empresaA->id]);

        $roleB = Role::create(['name' => 'Supervisor', 'guard_name' => 'api', 'empresa_id' => $empresaB->id]);

        $this->assertSame($empresaB->id, $roleB->empresa_id);

        // Sin EmpresaScope que filtre automáticamente (ADR-019), una query
        // sin filtro explícito ya ve ambas filas — nada que "bypasear".
        $this->assertSame(2, Role::where('name', 'Supervisor')->count());
    }
}
