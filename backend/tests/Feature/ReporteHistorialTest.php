<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\ReporteHistorial;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
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
        $context = app(TenantContext::class);

        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Reportes A', 'guard_name' => 'api']);
        $rolA->givePermissionTo(['reportes.ver']);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();
        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);
    }

    public function test_historial_lists_past_executions_for_the_current_company_only(): void
    {
        ReporteHistorial::create([
            'empresa_id' => $this->empresaA->id, 'usuario_id' => $this->userA->id,
            'tipo_reporte' => 'stock-actual', 'formato' => 'pdf', 'total_filas' => 5,
        ]);

        // `BelongsToEmpresa::creating()` fuerza `empresa_id` al de
        // `TenantContext` sin importar lo que se pase al `create()` — hay
        // que cambiar de contexto de verdad para sembrar un registro de
        // Empresa B, igual que en `ReporteControllerTest`.
        $context = app(TenantContext::class);
        $registrar = app(PermissionRegistrar::class);
        $context->setEmpresaId($this->empresaB->id);
        $registrar->setPermissionsTeamId($this->empresaB->id);
        ReporteHistorial::create([
            'tipo_reporte' => 'stock-actual', 'formato' => 'pdf', 'total_filas' => 9,
        ]);
        $context->setEmpresaId($this->empresaA->id);
        $registrar->setPermissionsTeamId($this->empresaA->id);

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
