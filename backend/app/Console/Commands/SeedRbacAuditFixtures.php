<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

/**
 * Usuarios QA dedicados a la validación real de Roles y Permisos (Work
 * Order "FidelOS Beta + Validación real de Roles y Permisos") — uno por
 * cada rol real de `RoleSeeder` (Administrador, Supervisor, Bodeguero,
 * Vendedor, Auxiliar Contable) en la empresa principal, más un segundo
 * Administrador en la empresa secundaria para el caso multi-tenant.
 * Idempotente (`firstOrCreate`) — no crea una empresa nueva, reutiliza
 * las dos ya sembradas por `DatabaseSeeder`.
 *
 * Nunca usuarios reales: todos `qa-rbac-*@example.com`, contraseña fija
 * de solo-desarrollo, documentada únicamente en el informe de QA, nunca
 * en un commit público ni en logs de producción.
 */
class SeedRbacAuditFixtures extends Command
{
    protected $signature = 'e2e:seed:rbac';

    protected $description = 'Crea/asegura un usuario QA por rol real (validación Beta/RBAC), idempotente';

    private const PASSWORD = 'Qa-Rbac-2026!';

    private const ROLES = ['Administrador', 'Supervisor', 'Bodeguero', 'Vendedor', 'Auxiliar Contable'];

    public function handle(): int
    {
        $empresaA = Empresa::where('nombre', 'Fidel OS Demo')->first();

        if ($empresaA === null) {
            $this->error('No se encontró la empresa principal ("Fidel OS Demo"). Corré `php artisan migrate:fresh --seed` primero.');

            return self::FAILURE;
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($empresaA->id);

        foreach (self::ROLES as $nombreRol) {
            $rol = Role::where('name', $nombreRol)->where('empresa_id', $empresaA->id)->first();

            if ($rol === null) {
                $this->warn("Rol \"{$nombreRol}\" no encontrado en la empresa principal — omitido.");

                continue;
            }

            $slug = str($nombreRol)->lower()->ascii()->slug();
            $usuario = User::firstOrCreate(
                ['email' => "qa-rbac-{$slug}@example.com"],
                [
                    'name' => "QA RBAC {$nombreRol}",
                    'empresa_id' => $empresaA->id,
                    'password' => bcrypt(self::PASSWORD),
                ],
            );

            // email_verified_at no es mass-assignable (User::$fillable, a
            // propósito) — firstOrCreate() lo ignora en silencio.
            if ($usuario->email_verified_at === null) {
                $usuario->forceFill(['email_verified_at' => now()])->save();
            }

            // Deterministas de verdad: si algún test de otro módulo
            // cambia la contraseña y no la revierte, este comando la
            // re-sincroniza en cada corrida (hallazgo real de la
            // auditoría RBAC anterior, 2026-08-16).
            if (! Hash::check(self::PASSWORD, $usuario->password)) {
                $usuario->forceFill(['password' => bcrypt(self::PASSWORD)])->save();
            }

            if (! $usuario->hasRole($rol)) {
                $usuario->syncRoles([$rol]);
            }

            $this->info("Listo: {$usuario->email} — rol {$nombreRol}, empresa {$empresaA->id}.");
        }

        $empresaB = Empresa::where('id', '!=', $empresaA->id)->first();

        if ($empresaB === null) {
            $this->warn('No existe una segunda empresa sembrada — el usuario multi-tenant (qa-rbac-admin-b) quedó omitido.');

            return self::SUCCESS;
        }

        app(PermissionRegistrar::class)->setPermissionsTeamId($empresaB->id);

        $adminB = Role::where('name', 'Administrador')->where('empresa_id', $empresaB->id)->first();

        if ($adminB === null) {
            $this->warn('Rol "Administrador" no encontrado en la segunda empresa — omitido qa-rbac-admin-b.');

            return self::SUCCESS;
        }

        $usuarioB = User::firstOrCreate(
            ['email' => 'qa-rbac-admin-b@example.com'],
            [
                'name' => 'QA RBAC Administrador (Empresa B)',
                'empresa_id' => $empresaB->id,
                'password' => bcrypt(self::PASSWORD),
            ],
        );

        if ($usuarioB->email_verified_at === null) {
            $usuarioB->forceFill(['email_verified_at' => now()])->save();
        }

        if (! Hash::check(self::PASSWORD, $usuarioB->password)) {
            $usuarioB->forceFill(['password' => bcrypt(self::PASSWORD)])->save();
        }

        if (! $usuarioB->hasRole($adminB)) {
            $usuarioB->syncRoles([$adminB]);
        }

        $this->info("Listo: {$usuarioB->email} — rol Administrador, empresa {$empresaB->id} (multi-tenant).");

        return self::SUCCESS;
    }
}
