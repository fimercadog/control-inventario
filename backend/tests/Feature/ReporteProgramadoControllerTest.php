<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\ReporteProgramado;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Reportes programados — ampliación 2026-08-03. Infraestructura
 * future-ready (sin motor de ejecución todavía, mismo patrón que
 * captura-ia.gestionar): estas pruebas cubren únicamente el CRUD ligero
 * y el límite de autorización `reportes.ver` (solo lectura) vs
 * `reportes.gestionar` (escritura), vía `ReportePolicy`.
 */
class ReporteProgramadoControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userGestor;

    private User $userSoloVer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userGestor = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userSoloVer = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($this->empresaA->id);

        $rolGestor = Role::create(['name' => 'Test Reportes Gestor', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolGestor->givePermissionTo(['reportes.ver', 'reportes.gestionar']);
        $this->userGestor->assignRole($rolGestor);

        $rolSoloVer = Role::create(['name' => 'Test Reportes Solo Ver', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolSoloVer->givePermissionTo(['reportes.ver']);
        $this->userSoloVer->assignRole($rolSoloVer);

        $registrar->forgetCachedPermissions();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Reporte semanal de stock bajo',
            'tipo_reporte' => 'stock-bajo',
            'formato' => 'pdf',
            'frecuencia' => 'semanal',
        ], $overrides);
    }

    public function test_a_user_with_gestionar_can_create_a_scheduled_report(): void
    {
        $response = $this->actingAs($this->userGestor, 'api')->postJson('/api/v1/reportes/programados', $this->payload());

        $response->assertCreated();
        $this->assertDatabaseHas('reportes_programados', [
            'empresa_id' => $this->empresaA->id,
            'usuario_id' => $this->userGestor->id,
            'tipo_reporte' => 'stock-bajo',
            'estado' => 'activo',
        ]);
    }

    public function test_a_user_with_only_ver_cannot_create_a_scheduled_report(): void
    {
        $this->actingAs($this->userSoloVer, 'api')
            ->postJson('/api/v1/reportes/programados', $this->payload())
            ->assertStatus(403);
    }

    public function test_a_user_with_only_ver_can_still_list_scheduled_reports(): void
    {
        ReporteProgramado::create($this->payload() + ['empresa_id' => $this->empresaA->id, 'usuario_id' => $this->userGestor->id, 'estado' => 'activo']);

        $this->actingAs($this->userSoloVer, 'api')
            ->getJson('/api/v1/reportes/programados')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_listing_scheduled_reports_never_includes_company_bs_definitions(): void
    {
        ReporteProgramado::create($this->payload() + ['empresa_id' => $this->empresaA->id, 'usuario_id' => $this->userGestor->id, 'estado' => 'activo']);
        ReporteProgramado::create($this->payload(['nombre' => 'Reporte de Empresa B']) + ['empresa_id' => $this->empresaB->id, 'usuario_id' => null, 'estado' => 'activo']);

        $response = $this->actingAs($this->userSoloVer, 'api')->getJson('/api/v1/reportes/programados');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $this->assertStringNotContainsString('Reporte de Empresa B', $response->getContent());
    }

    public function test_creating_a_scheduled_report_with_an_unknown_report_key_fails_validation(): void
    {
        $this->actingAs($this->userGestor, 'api')
            ->postJson('/api/v1/reportes/programados', $this->payload(['tipo_reporte' => 'no-existe']))
            ->assertStatus(422);
    }

    public function test_a_user_with_gestionar_can_delete_their_companys_scheduled_report(): void
    {
        $programado = ReporteProgramado::create($this->payload() + ['empresa_id' => $this->empresaA->id, 'usuario_id' => $this->userGestor->id, 'estado' => 'activo']);

        $this->actingAs($this->userGestor, 'api')
            ->deleteJson("/api/v1/reportes/programados/{$programado->id}")
            ->assertOk();

        $this->assertDatabaseMissing('reportes_programados', ['id' => $programado->id]);
    }

    public function test_company_b_cannot_delete_company_as_scheduled_report(): void
    {
        $programado = ReporteProgramado::create($this->payload() + ['empresa_id' => $this->empresaA->id, 'usuario_id' => $this->userGestor->id, 'estado' => 'activo']);

        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($this->empresaB->id);

        $userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $rolB = Role::create(['name' => 'Test Reportes B', 'guard_name' => 'api', 'empresa_id' => $this->empresaB->id]);
        $rolB->givePermissionTo(['reportes.ver', 'reportes.gestionar']);
        $userB->assignRole($rolB);
        $registrar->forgetCachedPermissions();

        // `FiltersByEmpresa::resolverParaEmpresaActual()` (ADR-019) ya
        // filtra explícitamente por la empresa del usuario autenticado —
        // el registro de Empresa A ni siquiera se encuentra en el contexto
        // de Empresa B, así que la resolución falla con 404 antes de que
        // `ReportePolicy::delete()` llegue a evaluarse (mismo patrón que
        // el resto del ERP, ver ProveedorControllerTest).
        $this->actingAs($userB, 'api')
            ->deleteJson("/api/v1/reportes/programados/{$programado->id}")
            ->assertStatus(404);

        $this->assertDatabaseHas('reportes_programados', ['id' => $programado->id]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/reportes/programados')->assertStatus(401);
    }
}
