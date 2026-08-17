<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Spatie\Permission\PermissionRegistrar;

/**
 * Fixtures deterministas para la suite Playwright (frontend/tests/e2e/),
 * idempotente (`firstOrCreate`) — puede correr antes de cada ejecución sin
 * duplicar datos. No reemplaza `DatabaseSeeder` (datos de demo a escala);
 * este comando solo garantiza que existan las cuentas puntuales que los
 * tests E2E necesitan por nombre fijo: un usuario de permisos limitados en
 * la empresa principal (negativo — sin `productos.crear`/`categorias.crear`)
 * y un usuario de una segunda empresa (aislamiento multiempresa).
 */
class SeedE2eFixtures extends Command
{
    protected $signature = 'e2e:seed';

    protected $description = 'Crea/asegura las cuentas fijas que usa la suite Playwright (idempotente)';

    public function handle(): int
    {
        $empresaPrincipal = Empresa::where('nombre', 'Fidel OS Demo')->first()
            ?? Empresa::whereHas('users', fn ($q) => $q->where('email', 'test@example.com'))->first();

        if ($empresaPrincipal === null) {
            $this->error('No se encontró la empresa principal (esperaba un usuario test@example.com ya sembrado). Corré `php artisan migrate:fresh --seed` primero.');

            return self::FAILURE;
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($empresaPrincipal->id);

        $bodeguero = Role::where('name', 'Bodeguero')->where('empresa_id', $empresaPrincipal->id)->first();

        if ($bodeguero !== null) {
            $usuarioLimitado = User::firstOrCreate(
                ['email' => 'e2e-bodeguero@fidelos.test'],
                ['name' => 'E2E Bodeguero', 'empresa_id' => $empresaPrincipal->id, 'password' => bcrypt('password-e2e'), 'email_verified_at' => now()],
            );

            if (! $usuarioLimitado->hasRole($bodeguero)) {
                $usuarioLimitado->syncRoles([$bodeguero]);
            }

            $this->info("Usuario de permisos limitados listo: {$usuarioLimitado->email} (rol Bodeguero, empresa {$empresaPrincipal->id}).");
        } else {
            $this->warn('Rol "Bodeguero" no encontrado en la empresa principal — omitido el usuario de permisos limitados.');
        }

        $empresaSecundaria = Empresa::where('id', '!=', $empresaPrincipal->id)->first();

        if ($empresaSecundaria !== null) {
            app(PermissionRegistrar::class)->setPermissionsTeamId($empresaSecundaria->id);

            $rolEmpresaB = Role::where('empresa_id', $empresaSecundaria->id)->first();

            $usuarioEmpresaB = User::firstOrCreate(
                ['email' => 'e2e-empresa-b@fidelos.test'],
                ['name' => 'E2E Empresa B', 'empresa_id' => $empresaSecundaria->id, 'password' => bcrypt('password-e2e'), 'email_verified_at' => now()],
            );

            if ($rolEmpresaB !== null && ! $usuarioEmpresaB->hasRole($rolEmpresaB)) {
                $usuarioEmpresaB->syncRoles([$rolEmpresaB]);
            }

            $this->info("Usuario de la segunda empresa listo: {$usuarioEmpresaB->email} (empresa {$empresaSecundaria->id}).");
        } else {
            $this->warn('No existe una segunda empresa sembrada — el test de aislamiento multiempresa quedará NOT_TESTABLE.');
        }

        return self::SUCCESS;
    }
}
