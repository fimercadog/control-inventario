<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(PermissionSeeder::class);

        // Empresa demo para el frontend (Fase 4): Captura IA exige un
        // empresa_id real (no hay endpoint de Empresas todavía — módulo
        // fuera de alcance). El frontend referencia este registro por id.
        $empresa = Empresa::firstOrCreate(['nombre' => 'Fidel OS Demo']);

        $usuario = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'empresa_id' => $empresa->id,
        ]);

        // Rol demo "Administrador" con todos los permisos del catálogo —
        // el módulo Roles (RC1 Fase 5) todavía no tiene UI de gestión, pero
        // el motor Spatie ya existe; sin esto el usuario demo queda sin
        // rol/permisos y el bloque de usuario del sidebar (RC1) no tendría
        // nada real que mostrar.
        //
        // `empresa_id` se fija a mano (no vía el hook `creating` de
        // BelongsToEmpresa) porque esta clase usa `WithoutModelEvents` —
        // ningún evento Eloquent dispara durante el seeding, así que el
        // hook automático nunca corre aquí. Mismo cuidado aplica a
        // cualquier modelo empresa-owned creado en este seeder.
        app(PermissionRegistrar::class)->setPermissionsTeamId($empresa->id);
        $rolAdministrador = Role::firstOrCreate(['name' => 'Administrador', 'guard_name' => 'api']);
        $rolAdministrador->empresa_id = $empresa->id;
        $rolAdministrador->save();
        $rolAdministrador->syncPermissions(Permission::where('guard_name', 'api')->get());
        $usuario->assignRole($rolAdministrador);
    }
}
