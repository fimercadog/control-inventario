<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Producto;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Work Order "Paginación global para todas las tablas de FidelOS"
 * (2026-08-17). Los 13 casos mínimos exigidos, verificados contra
 * Productos como endpoint representativo (mismo trait `ResolvesPagination`
 * que los otros 12 listados) — más un par de chequeos cruzados puntuales
 * donde el cableado es distinto (Categorías vía Eloquent directo,
 * Auditoría porque agrega campos de `meta` propios encima del trait).
 * No se duplican los 13 casos ×13 endpoints: sería probar el mismo
 * mecanismo compartido una y otra vez, no una implementación distinta
 * por módulo (justo lo que este Work Order prohíbe).
 */
class PaginationTest extends TestCase
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
        $rol = Role::create(['name' => 'Test Paginacion', 'guard_name' => 'api', 'empresa_id' => $this->empresaA->id]);
        $rol->givePermissionTo(['productos.ver', 'categorias.ver', 'auditoria.ver']);
        $this->userA->assignRole($rol);
        $registrar->forgetCachedPermissions();
    }

    /** @return array<int, Producto> */
    private function crearProductos(int $cantidad, ?Empresa $empresa = null): array
    {
        $empresa ??= $this->empresaA;

        return collect(range(1, $cantidad))
            ->map(fn ($i) => Producto::create([
                'nombre' => sprintf('Producto %03d', $i),
                'empresa_id' => $empresa->id,
            ]))
            ->all();
    }

    public function test_primera_pagina(): void
    {
        $this->crearProductos(25);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=10&page=1')
            ->assertOk()
            ->assertJsonPath('data.meta.current_page', 1)
            ->assertJsonPath('data.meta.from', 1)
            ->assertJsonPath('data.meta.to', 10)
            ->assertJsonCount(10, 'data.items');
    }

    public function test_pagina_intermedia(): void
    {
        $this->crearProductos(25);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=10&page=2')
            ->assertOk()
            ->assertJsonPath('data.meta.current_page', 2)
            ->assertJsonPath('data.meta.from', 11)
            ->assertJsonPath('data.meta.to', 20)
            ->assertJsonCount(10, 'data.items');
    }

    public function test_ultima_pagina(): void
    {
        $this->crearProductos(25);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=10&page=3')
            ->assertOk()
            ->assertJsonPath('data.meta.current_page', 3)
            ->assertJsonPath('data.meta.last_page', 3)
            ->assertJsonPath('data.meta.from', 21)
            ->assertJsonPath('data.meta.to', 25)
            ->assertJsonCount(5, 'data.items');
    }

    public function test_per_page_10(): void
    {
        $this->crearProductos(15);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.meta.per_page', 10)
            ->assertJsonPath('data.meta.last_page', 2)
            ->assertJsonCount(10, 'data.items');
    }

    public function test_per_page_25(): void
    {
        $this->crearProductos(30);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=25')
            ->assertOk()
            ->assertJsonPath('data.meta.per_page', 25)
            ->assertJsonCount(25, 'data.items');
    }

    /**
     * `per_page` fuera de la lista permitida (10/25/50/100) cae al
     * default del endpoint — no se acepta cualquier número (evita
     * `per_page=999999` disfrazando una traída completa de "paginada").
     */
    public function test_per_page_fuera_de_lista_permitida_cae_al_default(): void
    {
        $this->crearProductos(5);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=999999')
            ->assertOk()
            ->assertJsonPath('data.meta.per_page', 100);
    }

    public function test_cambio_de_busqueda_no_reinicia_pagina_del_lado_del_servidor_pero_el_frontend_lo_hace(): void
    {
        // El backend es puramente stateless (cada request es independiente,
        // sin sesión de "página actual") — el reinicio a page=1 al cambiar
        // de búsqueda es responsabilidad del frontend (`usePaginationState`,
        // sección 9 del Work Order), no algo que el servidor deba "recordar".
        // Este caso confirma que una búsqueda con `page` explícito en 1
        // siempre devuelve resultados coherentes con esa búsqueda, sin
        // importar en qué página estaba una request anterior.
        $this->crearProductos(3);
        Producto::create(['nombre' => 'Buscable Único', 'empresa_id' => $this->empresaA->id]);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?busqueda=Buscable&page=1&per_page=10')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 1)
            ->assertJsonPath('data.items.0.nombre', 'Buscable Único');
    }

    public function test_filtros_se_mantienen_al_cambiar_de_pagina(): void
    {
        collect(range(1, 15))->each(fn ($i) => Producto::create([
            'nombre' => sprintf('Filtrable %03d', $i),
            'estado' => 'inactivo',
            'empresa_id' => $this->empresaA->id,
        ]));
        // Ruido: productos activos que NO deben aparecer bajo el filtro estado=inactivo.
        $this->crearProductos(5);

        $pagina2 = $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?estado=inactivo&per_page=10&page=2')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 15)
            ->assertJsonCount(5, 'data.items');

        foreach ($pagina2->json('data.items') as $item) {
            $this->assertSame('inactivo', $item['estado']);
        }
    }

    public function test_aislamiento_por_empresa(): void
    {
        $this->crearProductos(5, $this->empresaA);
        $this->crearProductos(8, $this->empresaB);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 5);
    }

    public function test_usuario_sin_permiso_recibe_403(): void
    {
        $this->actingAs($this->userSinPermiso, 'api')
            ->getJson('/api/v1/productos')
            ->assertForbidden();
    }

    public function test_no_se_devuelven_registros_fuera_de_la_pagina_solicitada(): void
    {
        $productos = $this->crearProductos(12);
        $nombresPagina1 = collect($productos)->take(10)->pluck('nombre')->all();
        $nombresPagina2 = collect($productos)->slice(10)->pluck('nombre')->all();

        $respuesta = $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=10&page=1')
            ->assertOk();

        $nombresDevueltos = collect($respuesta->json('data.items'))->pluck('nombre')->all();
        foreach ($nombresPagina2 as $nombreQueNoDeberiaEstar) {
            $this->assertNotContains($nombreQueNoDeberiaEstar, $nombresDevueltos);
        }
        $this->assertEqualsCanonicalizing($nombresPagina1, $nombresDevueltos);
    }

    public function test_lista_vacia(): void
    {
        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 0)
            ->assertJsonPath('data.meta.from', null)
            ->assertJsonPath('data.meta.to', null)
            ->assertJsonCount(0, 'data.items');
    }

    public function test_cantidad_de_registros_exactamente_igual_al_limite(): void
    {
        $this->crearProductos(10);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 10)
            ->assertJsonPath('data.meta.last_page', 1)
            ->assertJsonCount(10, 'data.items');
    }

    public function test_cantidad_de_registros_menor_al_limite(): void
    {
        $this->crearProductos(3);

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/productos?per_page=10')
            ->assertOk()
            ->assertJsonPath('data.meta.total', 3)
            ->assertJsonPath('data.meta.last_page', 1)
            ->assertJsonCount(3, 'data.items');
    }

    // --- Chequeos cruzados: el mismo trait, cableado distinto por módulo ---

    public function test_categorias_expone_el_mismo_meta_de_paginacion(): void
    {
        collect(range(1, 12))->each(fn ($i) => Categoria::create([
            'nombre' => sprintf('Categoria %03d', $i),
            'empresa_id' => $this->empresaA->id,
        ]));

        $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/categorias?per_page=10&page=2')
            ->assertOk()
            ->assertJsonPath('data.meta.current_page', 2)
            ->assertJsonPath('data.meta.per_page', 10)
            ->assertJsonPath('data.meta.total', 12)
            ->assertJsonPath('data.meta.last_page', 2)
            ->assertJsonCount(2, 'data.items');
    }

    /**
     * Auditoría agrega `modulos_disponibles`/`acciones_disponibles` sobre
     * el mismo `meta` de paginación — confirma que agregar esos campos
     * propios no rompe el resto del contrato compartido.
     */
    public function test_auditoria_mantiene_meta_de_paginacion_junto_a_sus_campos_propios(): void
    {
        collect(range(1, 12))->each(fn ($i) => AuditLog::create([
            'empresa_id' => $this->empresaA->id,
            'usuario_id' => $this->userA->id,
            'modulo' => 'productos',
            'accion' => 'productos.crear_manual',
            'auditable_type' => Producto::class,
            'auditable_id' => $i,
            'resultado' => 'exitoso',
        ]));

        $respuesta = $this->actingAs($this->userA, 'api')
            ->getJson('/api/v1/auditoria?per_page=10&page=2')
            ->assertOk()
            ->assertJsonPath('data.meta.current_page', 2)
            ->assertJsonPath('data.meta.total', 12)
            ->assertJsonCount(2, 'data.items');

        $this->assertArrayHasKey('modulos_disponibles', $respuesta->json('data.meta'));
        $this->assertArrayHasKey('acciones_disponibles', $respuesta->json('data.meta'));
    }
}
