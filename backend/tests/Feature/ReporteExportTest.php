<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Producto;
use App\Models\ReporteHistorial;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\TenantContext;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Reportes — ampliación 2026-08-03: exportación PDF/Excel/CSV. Los tres
 * formatos comparten el mismo renderizador genérico
 * (`ReporteExportService`), así que estas pruebas cubren el contrato
 * (content-type, cuerpo no vacío) y el efecto secundario compartido
 * (una fila en `reporte_historial` por cada exportación), sin repetir
 * la lógica de cada uno de los 13 reportes ya cubierta en
 * `ReporteCatalogoPreviewTest`.
 */
class ReporteExportTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private User $userA;

    private User $userSinPermiso;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

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

        Producto::create(['nombre' => 'Producto Exportable', 'costo' => 10, 'stock_minimo' => 5, 'estado' => 'activo'])
            ->forceFill(['stock_actual' => 20])->save();
    }

    public function test_pdf_export_returns_a_non_empty_pdf_document(): void
    {
        $response = $this->actingAs($this->userA, 'api')->get('/api/v1/reportes/stock-actual/exportar/pdf');

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
        $this->assertGreaterThan(0, strlen($response->getContent()));
    }

    public function test_excel_export_returns_a_downloadable_xlsx_file(): void
    {
        $response = $this->actingAs($this->userA, 'api')->get('/api/v1/reportes/stock-actual/exportar/excel');

        $response->assertOk();
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('content-type'));
    }

    public function test_csv_export_returns_a_well_formed_csv_with_real_data(): void
    {
        $response = $this->actingAs($this->userA, 'api')->get('/api/v1/reportes/stock-actual/exportar/csv');

        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
        $this->assertStringContainsString('Producto Exportable', $response->streamedContent());
    }

    public function test_each_export_logs_an_execution_in_the_history(): void
    {
        $this->assertSame(0, ReporteHistorial::count());

        $this->actingAs($this->userA, 'api')->get('/api/v1/reportes/stock-actual/exportar/pdf');
        $this->actingAs($this->userA, 'api')->get('/api/v1/reportes/stock-actual/exportar/excel')->getContent();
        $this->actingAs($this->userA, 'api')->get('/api/v1/reportes/stock-actual/exportar/csv')->streamedContent();

        $this->assertSame(3, ReporteHistorial::count());
        $this->assertEqualsCanonicalizing(
            ['pdf', 'excel', 'csv'],
            ReporteHistorial::pluck('formato')->all()
        );
        $this->assertTrue(ReporteHistorial::where('tipo_reporte', 'stock-actual')->where('usuario_id', $this->userA->id)->exists());
    }

    public function test_export_endpoints_require_reportes_ver_permission(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->get('/api/v1/reportes/stock-actual/exportar/pdf')
            ->assertStatus(403);
    }

    public function test_unauthenticated_export_request_is_rejected(): void
    {
        $this->get('/api/v1/reportes/stock-actual/exportar/pdf')->assertStatus(401);
    }
}
