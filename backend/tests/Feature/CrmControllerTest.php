<?php

namespace Tests\Feature;

use App\Models\Automatizacion;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\EtapaOportunidad;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Illuminate\Support\Str;
use Tests\TestCase;

class CrmControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;
    private User $usuario;
    private Cliente $cliente;
    private EtapaOportunidad $etapa;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        $this->empresa = Empresa::create(['nombre' => 'CRM Empresa']);
        $this->usuario = User::factory()->create(['empresa_id' => $this->empresa->id]);
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->empresa->id);
        $rol = Role::create(['name' => 'CRM Admin', 'guard_name' => 'api', 'empresa_id' => $this->empresa->id]);
        $rol->givePermissionTo(['contactos.ver', 'contactos.crear', 'contactos.editar', 'contactos.convertir', 'oportunidades.ver', 'oportunidades.crear', 'oportunidades.editar', 'oportunidades.gestionar', 'actividades.ver', 'actividades.crear', 'actividades.completar', 'automatizaciones.ver', 'automatizaciones.gestionar']);
        $this->usuario->assignRole($rol);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->cliente = Cliente::create(['empresa_id' => $this->empresa->id, 'nombre' => 'Cliente CRM']);
        $this->etapa = EtapaOportunidad::create(['empresa_id' => $this->empresa->id, 'nombre' => 'Nuevo', 'orden' => 1, 'probabilidad' => 10, 'tipo' => 'abierta']);
    }

    public function test_user_can_create_and_convert_a_contact(): void
    {
        $contacto = $this->actingAs($this->usuario, 'api')->postJson('/api/v1/contactos', ['nombre' => 'Ana', 'apellido' => 'Ventas', 'email' => 'ana@example.test'])->assertCreated()->json('data.id');
        $this->actingAs($this->usuario, 'api')->postJson("/api/v1/contactos/{$contacto}/convertir")->assertOk()->assertJsonPath('data.estado', 'cliente');
        $this->assertDatabaseHas('contactos', ['id' => $contacto, 'empresa_id' => $this->empresa->id, 'estado' => 'cliente']);
    }

    public function test_creating_an_opportunity_executes_an_automatic_follow_up_once(): void
    {
        Automatizacion::create(['empresa_id' => $this->empresa->id, 'nombre' => 'Seguimiento', 'evento' => 'oportunidad.creada', 'acciones' => [['tipo' => 'crear_actividad', 'asunto' => 'Llamar al prospecto', 'dias' => 1]], 'activa' => true]);
        $response = $this->actingAs($this->usuario, 'api')->postJson('/api/v1/oportunidades', ['cliente_id' => $this->cliente->id, 'etapa_oportunidad_id' => $this->etapa->id, 'nombre' => 'Venta anual', 'monto' => 250000]);
        $response->assertCreated()->assertJsonPath('data.probabilidad', 10);
        $this->assertDatabaseHas('actividades', ['empresa_id' => $this->empresa->id, 'asunto' => 'Llamar al prospecto', 'estado' => 'pendiente']);
        $this->assertDatabaseCount('ejecuciones_automatizacion', 1);
    }

    public function test_user_without_crm_permission_is_rejected(): void
    {
        $sinPermiso = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $this->actingAs($sinPermiso, 'api')->getJson('/api/v1/oportunidades')->assertForbidden();
    }

    public function test_manual_offline_activity_is_synchronized_only_once(): void
    {
        $operacion = (string) Str::uuid();
        $payload = ['operacion_id' => $operacion, 'payload' => ['tipo' => 'llamada', 'asunto' => 'Llamada registrada sin conexión', 'descripcion' => 'Seguimiento manual']];

        $this->actingAs($this->usuario, 'api')->postJson('/api/v1/contingencia/actividades/sincronizar', $payload)
            ->assertOk()->assertJsonPath('data.asunto', 'Llamada registrada sin conexión');
        $this->actingAs($this->usuario, 'api')->postJson('/api/v1/contingencia/actividades/sincronizar', $payload)->assertOk();

        $this->assertDatabaseCount('actividades', 1);
        $this->assertDatabaseCount('contingencia_actividades_sync_log', 1);
    }
}
