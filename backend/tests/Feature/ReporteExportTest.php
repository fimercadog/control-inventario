<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\ReporteHistorial;
use App\Models\Role;
use App\Models\User;
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

    private Empresa $empresaB;

    private User $userA;

    private User $userSinPermiso;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Reportes A', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rolA->givePermissionTo(['reportes.ver']);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();

        Producto::create(['nombre' => 'Producto Exportable', 'costo' => 10, 'stock_minimo' => 5, 'estado' => 'activo', 'empresa_id' => $this->empresaA->id])
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

    public function test_csv_export_respects_the_same_filters_as_the_preview(): void
    {
        Producto::create(['nombre' => 'Producto Stock Normal', 'costo' => 5, 'stock_minimo' => 5, 'estado' => 'activo', 'empresa_id' => $this->empresaA->id])
            ->forceFill(['stock_actual' => 50])->save();
        Producto::create(['nombre' => 'Producto Stock Bajo Real', 'costo' => 5, 'stock_minimo' => 10, 'estado' => 'activo', 'empresa_id' => $this->empresaA->id])
            ->forceFill(['stock_actual' => 1])->save();

        // Fase 14: "NO aceptar que pantalla = correcto pero exportación =
        // diferente" — stock-bajo (mismo filtro fijo que preview, sin
        // parámetro de query) debe excluir el producto con stock normal
        // igual en el CSV que en preview.
        $response = $this->actingAs($this->userA, 'api')->get('/api/v1/reportes/stock-bajo/exportar/csv');

        $response->assertOk();
        $contenido = $response->streamedContent();
        $this->assertStringContainsString('Producto Stock Bajo Real', $contenido);
        $this->assertStringNotContainsString('Producto Stock Normal', $contenido);
        // El producto sembrado en setUp() (stock 20, mínimo 5) tampoco es
        // bajo — confirma que el filtro fijo de stock-bajo se aplicó, no
        // solo el nombre buscado arriba.
        $this->assertStringNotContainsString('Producto Exportable', $contenido);
    }

    public function test_csv_export_never_includes_company_bs_data(): void
    {
        $productoB = Producto::create(['nombre' => 'Producto Empresa B Exportable', 'costo' => 1, 'stock_minimo' => 0, 'estado' => 'activo', 'empresa_id' => $this->empresaB->id]);
        $productoB->forceFill(['stock_actual' => 5])->save();
        Movimiento::create([
            'producto_id' => $productoB->id, 'tipo' => 'entrada', 'cantidad' => 5,
            'stock_anterior' => 0, 'stock_nuevo' => 5, 'empresa_id' => $this->empresaB->id,
        ]);

        $response = $this->actingAs($this->userA, 'api')->get('/api/v1/reportes/stock-actual/exportar/csv');

        $response->assertOk();
        $this->assertStringNotContainsString('Producto Empresa B Exportable', $response->streamedContent());
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
