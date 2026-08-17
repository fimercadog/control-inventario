<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\ReporteHistorial;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Historial de ejecuciones de reportes — ampliación 2026-08-03.
 * `ReporteHistorial` es inmutable (mismo patrón que `AuditLog`); estas
 * pruebas cubren el listado paginado/filtrado y el aislamiento por
 * empresa, no la escritura (ya cubierta indirectamente en
 * `ReporteExportTest::test_each_export_logs_an_execution_in_the_history`).
 */
class ReporteHistorialTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Reportes A', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolA->givePermissionTo(['reportes.ver']);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();
    }

    public function test_historial_lists_past_executions_for_the_current_company_only(): void
    {
        ReporteHistorial::create([
            'empresa_id' => $this->empresaA->id, 'usuario_id' => $this->userA->id,
            'tipo_reporte' => 'stock-actual', 'formato' => 'pdf', 'total_filas' => 5,
        ]);

        // ADR-019: sin EmpresaScope/EmpresaContext, empresa_id ya no se
        // fuerza por contexto ambiente — cada fixture lo pasa explícito,
        // igual que en ReporteControllerTest.
        ReporteHistorial::create([
            'empresa_id' => $this->empresaB->id, 'tipo_reporte' => 'stock-actual', 'formato' => 'pdf', 'total_filas' => 9,
        ]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/reportes/historial');

        $response->assertOk();
        $response->assertJsonCount(1, 'data.items');
        $response->assertJsonPath('data.items.0.tipo_reporte', 'stock-actual');
        $response->assertJsonPath('data.meta.total', 1);
    }

    public function test_historial_filters_by_tipo_reporte_and_formato(): void
    {
        ReporteHistorial::create(['empresa_id' => $this->empresaA->id, 'tipo_reporte' => 'stock-actual', 'formato' => 'pdf', 'total_filas' => 1]);
        ReporteHistorial::create(['empresa_id' => $this->empresaA->id, 'tipo_reporte' => 'auditoria', 'formato' => 'csv', 'total_filas' => 1]);

        $response = $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/reportes/historial?tipo_reporte=auditoria&formato=csv');

        $response->assertOk();
        $response->assertJsonCount(1, 'data.items');
        $response->assertJsonPath('data.items.0.tipo_reporte', 'auditoria');
    }

    public function test_historial_requires_reportes_ver_permission(): void
    {
        $userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $this->actingAs($userSinPermiso, 'api')
            ->getJson('/api/v1/reportes/historial')
            ->assertStatus(403);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/reportes/historial')->assertStatus(401);
    }
}
