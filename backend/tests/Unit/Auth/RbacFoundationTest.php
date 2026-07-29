<?php

namespace Tests\Unit\Auth;

use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
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
        $context = app(TenantContext::class);

        // TenantContext y el team id de Spatie se mueven juntos: son la
        // misma columna empresa_id vista desde dos mecanismos distintos
        // (Módulo 2 — Company Isolation).
        $context->setEmpresaId($empresaA->id);
        $registrar->setPermissionsTeamId($empresaA->id);
        $role = Role::create(['name' => 'Bodeguero', 'guard_name' => 'api']);
        $role->givePermissionTo('productos.ver');
        $user->assignRole($role);

        $registrar->forgetCachedPermissions();
        $this->assertTrue($user->fresh()->can('productos.ver'));

        // Mismo usuario, contexto de otra empresa: el permiso no debe existir ahí.
        $context->setEmpresaId($empresaB->id);
        $registrar->setPermissionsTeamId($empresaB->id);
        $registrar->forgetCachedPermissions();
        $this->assertFalse($user->fresh()->can('productos.ver'));
    }

    public function test_roles_with_the_same_name_can_exist_independently_per_empresa(): void
    {
        $empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $context = app(TenantContext::class);

        $context->setEmpresaId($empresaA->id);
        Role::create(['name' => 'Supervisor', 'guard_name' => 'api']);

        $context->setEmpresaId($empresaB->id);
        $roleB = Role::create(['name' => 'Supervisor', 'guard_name' => 'api']);

        $this->assertSame($empresaB->id, $roleB->empresa_id);

        $context->bypass();
        $this->assertSame(2, Role::where('name', 'Supervisor')->count());
    }
}
