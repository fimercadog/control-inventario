<?php

namespace Tests\Feature;

use App\Models\Empresa;
use App\Models\Actividad;
use App\Models\Automatizacion;
use App\Models\Contacto;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Dashboard (2026-08-11, cierre definitivo — antes 100% mock data en el
 * frontend). Sin tests de crear/editar/eliminar: es una vista computada
 * de solo lectura sobre Productos/Movimientos, igual que Reportes. Sin
 * permiso propio a propósito (docs/03_FUNCTIONAL_SPEC/Dashboard.md) — el
 * foco de RBAC aquí es confirmar que cualquier usuario autenticado de una
 * empresa accede, sin exigir un permiso inexistente.
 */
class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        // Sin rol ni permiso asignado a propósito — Dashboard no exige
        // ninguno (ver docblock de esta clase).
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id]);
        $this->userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
    }

    private function crearProducto(Empresa $empresa, array $overrides = []): Producto
    {
        $stockActual = $overrides['stock_actual'] ?? null;
        unset($overrides['stock_actual']);

        $producto = Producto::create(array_merge([
            'nombre' => 'Producto '.uniqid(),
            'costo' => 10,
            'stock_minimo' => 5,
            'estado' => 'activo',
            'empresa_id' => $empresa->id,
        ], $overrides));

        if ($stockActual !== null) {
            $producto->forceFill(['stock_actual' => $stockActual])->save();
        }

        return $producto->fresh();
    }

    private function crearMovimiento(Empresa $empresa, Producto $producto, array $overrides = []): Movimiento
    {
        return Movimiento::create(array_merge([
            'producto_id' => $producto->id,
            'tipo' => 'entrada',
            'cantidad' => 1,
            'stock_anterior' => 0,
            'stock_nuevo' => 1,
            'empresa_id' => $empresa->id,
        ], $overrides));
    }

    public function test_a_user_can_view_the_dashboard_summary(): void
    {
        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/dashboard');

        $response->assertOk();
        $data = $response->json('data');
        foreach (['total_productos', 'total_stock', 'productos_stock_bajo', 'entradas_hoy', 'salidas_hoy', 'movimientos_recientes', 'productos_con_stock_bajo'] as $clave) {
            $this->assertArrayHasKey($clave, $data);
        }
    }

    public function test_metrics_reflect_real_data(): void
    {
        $this->crearProducto($this->empresaA, ['stock_actual' => 20, 'stock_minimo' => 5]); // ok
        $bajo = $this->crearProducto($this->empresaA, ['nombre' => 'Bajo Stock', 'stock_actual' => 2, 'stock_minimo' => 10]);
        $this->crearProducto($this->empresaA, ['estado' => 'inactivo', 'stock_actual' => 999]); // no debe contar

        $this->crearMovimiento($this->empresaA, $bajo, ['tipo' => 'entrada', 'cantidad' => 5]);
        $antiguo = $this->crearMovimiento($this->empresaA, $bajo, ['tipo' => 'salida', 'cantidad' => 3]);
        $antiguo->forceFill(['created_at' => now()->subDays(5)])->save();

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.total_productos', 2);
        $response->assertJsonPath('data.total_stock', 22);
        $response->assertJsonPath('data.productos_stock_bajo', 1);
        $response->assertJsonPath('data.entradas_hoy', 1);
        $response->assertJsonPath('data.salidas_hoy', 0); // la salida quedó fuera de "hoy"
        $response->assertJsonPath('data.productos_con_stock_bajo.0.nombre', 'Bajo Stock');
    }

    public function test_crm_overdue_activities_are_exposed_as_dashboard_alerts(): void
    {
        Actividad::create([
            'empresa_id' => $this->empresaA->id,
            'asunto' => 'Llamar a Cliente prioritario',
            'estado' => 'pendiente',
            'programada_para' => now()->subDay(),
        ]);
        Actividad::create([
            'empresa_id' => $this->empresaB->id,
            'asunto' => 'No debe aparecer',
            'estado' => 'pendiente',
            'programada_para' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.crm.actividades_vencidas', 1);
        $response->assertJsonPath('data.crm.actividades_vencidas_destacadas.0.asunto', 'Llamar a Cliente prioritario');
        $this->assertCount(1, $response->json('data.crm.actividades_vencidas_destacadas'));
    }

    public function test_crm_module_alerts_reflect_only_the_current_company(): void
    {
        $contactoA = Contacto::create(['empresa_id' => $this->empresaA->id, 'nombre' => 'Contacto sin gestión', 'email' => 'duplicado@example.test']);
        $contactoA->forceFill(['created_at' => now()->subDays(15)])->save();
        Contacto::create(['empresa_id' => $this->empresaA->id, 'nombre' => 'Contacto duplicado', 'email' => 'duplicado@example.test']);
        Contacto::create(['empresa_id' => $this->empresaB->id, 'nombre' => 'Contacto ajeno', 'email' => 'duplicado@example.test']);
        Automatizacion::create(['empresa_id' => $this->empresaA->id, 'nombre' => 'Regla sin ejecutar', 'evento' => 'oportunidad.creada', 'acciones' => []])
            ->forceFill(['created_at' => now()->subDays(15)])->save();
        Automatizacion::create(['empresa_id' => $this->empresaB->id, 'nombre' => 'Regla ajena', 'evento' => 'oportunidad.creada', 'acciones' => [], 'activa' => false]);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.crm.alertas.contactos_sin_responsable', 2);
        $response->assertJsonPath('data.crm.alertas.contactos_sin_gestion', 1);
        $response->assertJsonPath('data.crm.alertas.contactos_duplicados', 2);
        $response->assertJsonPath('data.crm.alertas.automatizaciones_sin_ejecucion', 1);
        $response->assertJsonPath('data.crm.alertas.automatizaciones_desactivadas', 0);
    }

    public function test_recent_movements_are_ordered_by_most_recent_first_and_limited_to_six(): void
    {
        $producto = $this->crearProducto($this->empresaA);

        foreach (range(1, 8) as $i) {
            $movimiento = $this->crearMovimiento($this->empresaA, $producto, ['cantidad' => $i]);
            $movimiento->forceFill(['created_at' => now()->subMinutes(8 - $i)])->save();
        }

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/dashboard');

        $response->assertOk();
        $this->assertCount(6, $response->json('data.movimientos_recientes'));
        $response->assertJsonPath('data.movimientos_recientes.0.cantidad', 8);
    }

    public function test_company_a_never_sees_company_bs_data(): void
    {
        $this->crearProducto($this->empresaA, ['stock_actual' => 10]);
        $productoB1 = $this->crearProducto($this->empresaB, ['stock_actual' => 500]);
        $this->crearProducto($this->empresaB, ['stock_actual' => 500]);
        $this->crearMovimiento($this->empresaB, $productoB1, ['cantidad' => 999]);

        $responseA = $this->actingAs($this->userA, 'api')->getJson('/api/v1/dashboard');
        $responseA->assertOk();
        $responseA->assertJsonPath('data.total_productos', 1);
        $responseA->assertJsonPath('data.total_stock', 10);
        $this->assertCount(0, $responseA->json('data.movimientos_recientes'));

        $responseB = $this->actingAs($this->userB, 'api')->getJson('/api/v1/dashboard');
        $responseB->assertOk();
        $responseB->assertJsonPath('data.total_productos', 2);
        $responseB->assertJsonPath('data.total_stock', 1000);
        $this->assertCount(1, $responseB->json('data.movimientos_recientes'));
    }

    public function test_a_user_with_no_role_or_permission_at_all_can_still_access_the_dashboard(): void
    {
        // Dashboard no exige ningún permiso (ver docblock de esta clase) —
        // este test prueba explícitamente que eso sigue siendo cierto, no
        // se asume por ausencia de un chequeo.
        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/dashboard');

        $response->assertOk();
    }

    public function test_an_empty_company_returns_zeroed_metrics_not_errors(): void
    {
        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/dashboard');

        $response->assertOk();
        $response->assertJsonPath('data.total_productos', 0);
        $response->assertJsonPath('data.total_stock', 0);
        $response->assertJsonPath('data.productos_stock_bajo', 0);
        $response->assertJsonPath('data.entradas_hoy', 0);
        $response->assertJsonPath('data.salidas_hoy', 0);
        $this->assertSame([], $response->json('data.movimientos_recientes'));
        $this->assertSame([], $response->json('data.productos_con_stock_bajo'));
    }

    public function test_query_parameters_are_ignored_not_used_to_manipulate_the_scope(): void
    {
        $this->crearProducto($this->empresaA, ['stock_actual' => 10]);
        $this->crearProducto($this->empresaB, ['stock_actual' => 500]);

        $response = $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/dashboard?empresa_id='.$this->empresaB->id);

        $response->assertOk();
        $response->assertJsonPath('data.total_productos', 1);
        $response->assertJsonPath('data.total_stock', 10);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/dashboard')->assertStatus(401);
    }
}
