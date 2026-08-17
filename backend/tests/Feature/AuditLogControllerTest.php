<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Auditoría (2026-08-02). Solo lectura por diseño — no hay tests de
 * crear/editar/eliminar porque esas acciones no existen en este módulo
 * (AuditLog es inmutable, las escrituras las hacen los demás módulos vía
 * Services\Audit\AuditLogger). El foco distintivo de esta suite es la
 * regla de privacidad no negociable confirmada por el propietario del
 * proyecto: un registro de auditoría nunca expone el nombre real de una
 * persona, solo su email de cuenta y su(s) rol(es).
 */
class AuditLogControllerTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresaA;

    private Empresa $empresaB;

    private User $userA;

    private User $userB;

    private User $userSinPermiso;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(PermissionSeeder::class);

        $this->empresaA = Empresa::create(['nombre' => 'Empresa A']);
        $this->empresaB = Empresa::create(['nombre' => 'Empresa B']);
        $this->userA = User::factory()->create(['empresa_id' => $this->empresaA->id, 'name' => 'Nombre Real De Usuario A']);
        $this->userB = User::factory()->create(['empresa_id' => $this->empresaB->id]);
        $this->userSinPermiso = User::factory()->create(['empresa_id' => $this->empresaA->id]);

        $registrar = app(PermissionRegistrar::class);

        $registrar->setPermissionsTeamId($this->empresaA->id);
        $rolA = Role::create(['name' => 'Test Auditoria A', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        // categorias.crear también, solo para el test de integridad real
        // (Fase 9): produce una acción de negocio real en vez de escribir
        // el AuditLog sintéticamente, para probar el pipeline de punta a
        // punta desde el módulo productor hasta este módulo consumidor.
        $rolA->givePermissionTo(['auditoria.ver', 'categorias.crear']);
        $this->userA->assignRole($rolA);
        $registrar->forgetCachedPermissions();

        $registrar->setPermissionsTeamId($this->empresaB->id);
        $rolB = Role::create(['name' => 'Test Auditoria B', 'guard_name' => 'api', 'empresa_id' => $this->empresaB->id]);
        $rolB->givePermissionTo(['auditoria.ver']);
        $this->userB->assignRole($rolB);
        $registrar->forgetCachedPermissions();

        $registrar->setPermissionsTeamId($this->empresaA->id);
    }

    private function crearRegistro(array $overrides = []): AuditLog
    {
        return AuditLog::create(array_merge([
            'empresa_id' => $this->empresaA->id,
            'usuario_id' => $this->userA->id,
            'modulo' => 'productos',
            'accion' => 'productos.crear',
            'auditable_type' => 'App\\Models\\Producto',
            'auditable_id' => 1,
            'valores_anteriores' => null,
            'valores_nuevos' => ['nombre' => 'Producto de prueba'],
            'resultado' => 'exitoso',
            'ip' => '127.0.0.1',
            'user_agent' => 'PHPUnit',
        ], $overrides));
    }

    public function test_a_user_can_list_their_own_companys_audit_logs(): void
    {
        $this->crearRegistro();
        $this->crearRegistro(['modulo' => 'clientes', 'accion' => 'clientes.editar']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/auditoria')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 2);
    }

    public function test_a_user_can_view_a_single_audit_log_with_full_detail(): void
    {
        $registro = $this->crearRegistro([
            'valores_anteriores' => ['estado' => 'activo'],
            'valores_nuevos' => ['estado' => 'inactivo'],
        ]);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/auditoria/{$registro->id}")
            ->assertOk()
            ->assertJsonPath('data.modulo', 'productos')
            ->assertJsonPath('data.accion', 'productos.crear')
            ->assertJsonPath('data.valores_anteriores.estado', 'activo')
            ->assertJsonPath('data.valores_nuevos.estado', 'inactivo')
            ->assertJsonPath('data.resultado', 'exitoso')
            ->assertJsonPath('data.ip', '127.0.0.1');
    }

    public function test_a_real_persons_name_is_never_exposed_anywhere_in_the_response(): void
    {
        $registro = $this->crearRegistro();

        $lista = $this->actingAs($this->userA, 'api')->getJson('/api/v1/auditoria');
        $lista->assertOk();
        $this->assertStringNotContainsString('Nombre Real De Usuario A', $lista->getContent());
        $this->assertArrayNotHasKey('name', $lista->json('data.items.0.usuario'));

        $detalle = $this->actingAs($this->userA, 'api')->getJson("/api/v1/auditoria/{$registro->id}");
        $detalle->assertOk();
        $this->assertStringNotContainsString('Nombre Real De Usuario A', $detalle->getContent());
        $this->assertArrayNotHasKey('name', $detalle->json('data.usuario'));
        $detalle->assertJsonPath('data.usuario.email', $this->userA->email);
        $detalle->assertJsonPath('data.usuario.roles.0', 'Test Auditoria A');
    }

    public function test_a_record_with_no_linked_user_shows_a_null_usuario_not_an_error(): void
    {
        $registro = $this->crearRegistro(['usuario_id' => null]);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/auditoria/{$registro->id}")
            ->assertOk()
            ->assertJsonPath('data.usuario', null);
    }

    public function test_filtering_by_modulo(): void
    {
        $this->crearRegistro(['modulo' => 'productos']);
        $this->crearRegistro(['modulo' => 'clientes', 'accion' => 'clientes.crear']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/auditoria?modulo=clientes')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.modulo', 'clientes');
    }

    public function test_filtering_by_accion(): void
    {
        $this->crearRegistro(['accion' => 'productos.crear']);
        $this->crearRegistro(['accion' => 'productos.gestionar']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/auditoria?accion=productos.gestionar')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_filtering_by_usuario_id(): void
    {
        $this->crearRegistro(['usuario_id' => $this->userA->id]);
        $this->crearRegistro(['usuario_id' => null]);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/auditoria?usuario_id={$this->userA->id}")
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_filtering_by_date_range(): void
    {
        $this->crearRegistro()->forceFill(['created_at' => now()->subDays(10)])->save();
        $reciente = $this->crearRegistro();

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/auditoria?desde='.now()->subDay()->toDateString())
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.id', $reciente->id);
    }

    public function test_free_text_search_matches_modulo_accion_or_resultado(): void
    {
        $this->crearRegistro(['modulo' => 'movimientos', 'accion' => 'movimientos.crear']);
        $this->crearRegistro(['modulo' => 'clientes', 'accion' => 'clientes.crear']);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/auditoria?busqueda=movimientos')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1);
    }

    public function test_index_response_includes_available_modulos_and_acciones_for_filters(): void
    {
        $this->crearRegistro(['modulo' => 'productos', 'accion' => 'productos.crear']);
        $this->crearRegistro(['modulo' => 'clientes', 'accion' => 'clientes.editar']);

        $response = $this->actingAs($this->userA, 'api')->getJson('/api/v1/auditoria');

        $response->assertOk();
        $this->assertEqualsCanonicalizing(['clientes', 'productos'], $response->json('data.meta.modulos_disponibles'));
        $this->assertEqualsCanonicalizing(['clientes.editar', 'productos.crear'], $response->json('data.meta.acciones_disponibles'));
    }

    public function test_pagination_is_real(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->crearRegistro();
        }

        $primera = $this->actingAs($this->userA, 'api')->getJson('/api/v1/auditoria');
        $primera->assertOk()->assertJsonPath('data.meta.last_page', 2);

        $segunda = $this->actingAs($this->userA, 'api')->getJson('/api/v1/auditoria?page=2');
        $segunda->assertOk();
        $this->assertCount(5, $segunda->json('data.items'));
    }

    public function test_company_b_cannot_view_company_as_audit_log(): void
    {
        $registro = $this->crearRegistro();

        $this->actingAs($this->userB, 'api')
            ->getJson("/api/v1/auditoria/{$registro->id}")
            ->assertStatus(404);

        $this->actingAs($this->userB, 'api')
            ->getJson('/api/v1/auditoria')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);
    }

    public function test_company_a_cannot_view_company_bs_audit_log_directly_by_id(): void
    {
        $registroB = $this->crearRegistro([
            'empresa_id' => $this->empresaB->id,
            'usuario_id' => $this->userB->id,
        ]);

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/auditoria/{$registroB->id}")
            ->assertStatus(404);
    }

    public function test_filtering_by_a_foreign_companys_usuario_id_returns_empty_not_a_cross_company_leak(): void
    {
        $this->crearRegistro([
            'empresa_id' => $this->empresaB->id,
            'usuario_id' => $this->userB->id,
        ]);
        $this->crearRegistro();

        $this->actingAs($this->userA, 'api')
            ->getJson("/api/v1/auditoria?usuario_id={$this->userB->id}")
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0);
    }

    public function test_a_real_business_action_produces_a_complete_and_queryable_audit_entry(): void
    {
        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/categorias', ['nombre' => 'Categoria Auditada Real'])
            ->assertCreated();

        $response = $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/auditoria?modulo=categorias&accion=categorias.crear');

        $response->assertOk()->assertJsonPath('data.meta.total', 1);

        $item = $response->json('data.items.0');
        $this->assertSame($this->userA->id, $item['usuario']['id']);
        $this->assertSame('categorias', $item['modulo']);
        $this->assertSame('categorias.crear', $item['accion']);
        $this->assertNotNull($item['auditable_id']);
        $this->assertNotNull($item['created_at']);
        $this->assertSame('Categoria Auditada Real', $item['valores_nuevos']['nombre'] ?? null);
    }

    public function test_there_is_no_create_update_or_delete_endpoint_for_audit_logs(): void
    {
        $registro = $this->crearRegistro();

        $this->actingAs($this->userA, 'api')
            ->postJson('/api/v1/auditoria', ['modulo' => 'x', 'accion' => 'x.y'])
            ->assertStatus(405);

        $this->actingAs($this->userA, 'api')
            ->patchJson("/api/v1/auditoria/{$registro->id}", ['modulo' => 'y'])
            ->assertStatus(405);

        $this->actingAs($this->userA, 'api')
            ->deleteJson("/api/v1/auditoria/{$registro->id}")
            ->assertStatus(405);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/auditoria')->assertStatus(401);
    }

    public function test_a_user_without_permission_is_rejected_with_403(): void
    {
        $registro = $this->crearRegistro();

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/auditoria')
            ->assertStatus(403);

        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson("/api/v1/auditoria/{$registro->id}")
            ->assertStatus(403);
    }
}
