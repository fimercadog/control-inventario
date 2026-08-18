<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\PermissionRegistrar;

/**
 * Demo Data RC1 (docs/06_TESTS/DemoDataAudit.md). Orquesta los seeders
 * independientes por módulo para dos empresas: la empresa demo principal
 * (volumen completo, la que usa `test@example.com` para login real) y una
 * segunda empresa a escala reducida, solo para probar aislamiento de
 * datos por empresa con datos reales (no una fila vacía).
 *
 * `empresa_id` se fija a mano en cada modelo empresa-owned creado aquí
 * (nunca vía el hook `creating` de BelongsToEmpresa) porque esta clase usa
 * WithoutModelEvents — ningún evento Eloquent dispara durante el seeding.
 */
class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /** Volumen objetivo para la empresa principal (docs/06_TESTS/DemoDataAudit.md). */
    private const VOLUMEN_BASE = [
        'categorias' => 20,
        'marcas' => 30,
        'unidades' => 11,
        'productos' => 500,
        'proveedores' => 100,
        'clientes' => 150,
        'movimientos' => 10000,
        'capturas_ia' => 100,
        'auditoria' => 5000,
        'usuarios' => 15,
    ];

    public function run(): void
    {
        $this->call(PermissionSeeder::class);

        $empresaPrincipal = Empresa::firstOrCreate(['nombre' => 'Fidel OS Demo']);
        $empresaSecundaria = Empresa::factory()->create(['nombre' => 'Distribuidora Andina S.A.S.']);

        $this->poblarEmpresa($empresaPrincipal, escala: 1.0, esPrincipal: true);
        $this->poblarEmpresa($empresaSecundaria, escala: 0.15, esPrincipal: false);
    }

    private function poblarEmpresa(Empresa $empresa, float $escala, bool $esPrincipal): void
    {
        $this->command?->info("Poblando empresa: {$empresa->nombre} (escala {$escala})");

        // ADR-019: sin EmpresaScope, cada seeder de abajo filtra/asigna
        // empresa_id explícito (ver RoleSeeder, ProductoSeeder, etc.) — el
        // team id de Spatie sigue haciendo falta aquí, es lo único que
        // protege syncPermissions()/assignRole() más abajo.
        app(PermissionRegistrar::class)->setPermissionsTeamId($empresa->id);

        $roles = (new RoleSeeder())->crear($empresa);

        $usuariosNuevos = max(2, (int) round(self::VOLUMEN_BASE['usuarios'] * $escala));

        if ($esPrincipal) {
            // Cuenta demo fija — la usa el login real de la aplicación
            // (docs/05_IMPLEMENTATION/SidebarRC1.md y toda la sesión de
            // verificación en navegador dependen de este email/password).
            $usuarioDemo = User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'empresa_id' => $empresa->id,
            ]);
            $usuarioDemo->assignRole($roles['Administrador']);
            $usuariosNuevos--;
        }

        (new UserSeeder())->crear($empresa, $roles, max(1, $usuariosNuevos));

        (new CategoriaSeeder())->crear($empresa, (int) round(self::VOLUMEN_BASE['categorias'] * $escala));
        (new MarcaSeeder())->crear($empresa, (int) round(self::VOLUMEN_BASE['marcas'] * $escala));
        (new UnidadMedidaSeeder())->crear($empresa, (int) round(self::VOLUMEN_BASE['unidades'] * $escala));

        (new ProductoSeeder())->crear($empresa, max(10, (int) round(self::VOLUMEN_BASE['productos'] * $escala)));
        (new ProveedorSeeder())->crear($empresa, max(5, (int) round(self::VOLUMEN_BASE['proveedores'] * $escala)));
        (new ClienteSeeder())->crear($empresa, max(5, (int) round(self::VOLUMEN_BASE['clientes'] * $escala)));
        $paresCreados = (new ProductoProveedorSeeder())->crear($empresa);
        $this->command?->info("  producto_proveedor: {$paresCreados} pares creados");

        $movimientosCreados = (new MovimientoSeeder())->crear(
            $empresa,
            max(50, (int) round(self::VOLUMEN_BASE['movimientos'] * $escala))
        );
        $this->command?->info("  movimientos: {$movimientosCreados} creados");

        (new CapturaIASeeder())->crear($empresa, max(5, (int) round(self::VOLUMEN_BASE['capturas_ia'] * $escala)));
        (new AuditLogSeeder())->crear($empresa, max(50, (int) round(self::VOLUMEN_BASE['auditoria'] * $escala)));
    }
}
