<?php

namespace App\Services;

use App\Events\ProductCreated;
use App\Models\Categoria;
use App\Models\Marca;
use App\Models\Producto;
use App\Models\UnidadMedida;
use App\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Dueño exclusivo del catálogo de productos: alta y búsqueda por identidad.
 * Nunca modifica stock_actual: eso es responsabilidad única de
 * InventoryService (ver sección 74 del master spec, "Propiedad exclusiva
 * del stock"). Consumido por Captura IA solo por delegación — la regla de
 * qué hace "coincidir" un producto vive aquí, no en Captura IA
 * (sección 74, "Captura IA nunca contiene reglas de negocio").
 */
class ProductService
{
    public function __construct(
        private readonly ProductRepository $productos,
    ) {
    }

    /**
     * Coincidencia de identidad: nombre + marca + presentación, dentro de
     * la misma empresa. Es la regla oficial de "mismo producto" para todo
     * el sistema (Captura IA, y a futuro Compras/Ventas al recibir datos
     * externos), no una particularidad de Captura IA.
     */
    public function buscarCoincidencia(
        int $empresaId,
        string $nombre,
        ?string $marca,
        ?string $presentacion,
    ): ?Producto {
        return $this->productos->buscarPorNombreMarcaPresentacion($empresaId, $nombre, $marca, $presentacion);
    }

    /**
     * Da de alta un producto en el catálogo con stock_actual = 0.
     * Para asignarle stock inicial, seguir con InventoryService::registrarMovimiento().
     *
     * @param array<string, mixed> $datos
     */
    public function crear(array $datos): Producto
    {
        $producto = Producto::create([
            'empresa_id' => $datos['empresa_id'],
            'categoria_id' => $this->resolverCategoriaId($datos),
            'codigo' => $datos['codigo'] ?? null,
            'codigo_barras' => $datos['codigo_barras'] ?? null,
            'nombre' => $datos['nombre'],
            'marca_id' => $this->resolverMarcaId($datos),
            'descripcion' => $datos['descripcion'] ?? null,
            'presentacion' => $datos['presentacion'] ?? null,
            'costo' => $datos['costo'] ?? 0,
            'precio' => $datos['precio'] ?? 0,
            'unidad_medida_id' => $this->resolverUnidadMedidaId($datos),
            'stock_minimo' => $datos['stock_minimo'] ?? 0,
            'stock_maximo' => $datos['stock_maximo'] ?? null,
            'imagen' => $datos['imagen'] ?? null,
            'estado' => $datos['estado'] ?? 'activo',
        ]);

        // afterCommit: si esta creación es parte de una transacción más
        // grande (ej. el pipeline completo de Captura IA) y esa transacción
        // termina en rollback, el evento nunca se dispara (sección 74,
        // punto 6 — "después de completar exitosamente").
        DB::afterCommit(fn () => event(new ProductCreated($producto)));

        return $producto;
    }

    /**
     * RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Brands.md): `marca` dejó de ser
     * texto libre. Resuelve, en orden: `marca_id` explícito (selección
     * manual de catálogo), `marca_nuevo` (quick-create manual) o `marca`
     * (texto libre que sigue mandando Captura IA sin cambios en su
     * contrato — ver `App\Actions\CapturaIA\ApplyInventoryMovementAction`).
     *
     * Auditoría de cierre de módulo (2026-08-11): `marca_id` explícito se
     * verificaba sin comprobar que perteneciera a la empresa actual —
     * confirmado explotable (una empresa podía enlazar un producto propio
     * a la Marca de otra empresa). Mismo criterio que ya usa
     * `ProductoProveedorController::store()` para `proveedor_id`
     * (`resolverParaEmpresaActual`), aplicado aquí vía `pertenece()`.
     *
     * @param array<string, mixed> $datos
     */
    public function resolverMarcaId(array $datos): ?int
    {
        if (! empty($datos['marca_id'])) {
            $marcaId = (int) $datos['marca_id'];
            abort_unless($this->pertenece(Marca::class, $marcaId, (int) $datos['empresa_id']), 404);

            return $marcaId;
        }

        $nombre = $datos['marca_nuevo'] ?? $datos['marca'] ?? null;

        if (empty($nombre)) {
            return null;
        }

        return $this->buscarOCrearCatalogo(Marca::class, (int) $datos['empresa_id'], $nombre)->id;
    }

    /**
     * Mismo tratamiento que resolverMarcaId() para `unidad_medida`
     * (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md), incluida la misma
     * corrección de la auditoría de cierre 2026-08-11.
     *
     * @param array<string, mixed> $datos
     */
    public function resolverUnidadMedidaId(array $datos): ?int
    {
        if (! empty($datos['unidad_medida_id'])) {
            $unidadId = (int) $datos['unidad_medida_id'];
            abort_unless($this->pertenece(UnidadMedida::class, $unidadId, (int) $datos['empresa_id']), 404);

            return $unidadId;
        }

        $nombre = $datos['unidad_medida_nuevo'] ?? $datos['unidad_medida'] ?? null;

        if (empty($nombre)) {
            return null;
        }

        return $this->buscarOCrearCatalogo(UnidadMedida::class, (int) $datos['empresa_id'], $nombre)->id;
    }

    /**
     * `categoria_id` no tiene variante `_nuevo` (el formulario selecciona
     * de un catálogo existente, nunca crea al vuelo) — solo verifica
     * pertenencia, mismo criterio y misma auditoría que las dos de arriba.
     *
     * @param array<string, mixed> $datos
     */
    public function resolverCategoriaId(array $datos): ?int
    {
        if (empty($datos['categoria_id'])) {
            return null;
        }

        $categoriaId = (int) $datos['categoria_id'];
        abort_unless($this->pertenece(Categoria::class, $categoriaId, (int) $datos['empresa_id']), 404);

        return $categoriaId;
    }

    /**
     * @param class-string<Model> $modelo
     */
    private function pertenece(string $modelo, int $id, int $empresaId): bool
    {
        return $modelo::where('id', $id)->where('empresa_id', $empresaId)->exists();
    }

    /**
     * Find-or-create case-insensitive por (empresa_id, nombre) — mismo
     * criterio que ya usaba `ProductRepository::buscarPorNombreMarcaPresentacion()`
     * antes de esta migración, para no cambiar el comportamiento observable
     * del matching de Captura IA.
     *
     * @param class-string<Model> $modelo
     */
    private function buscarOCrearCatalogo(string $modelo, int $empresaId, string $nombre): Model
    {
        $nombre = trim($nombre);

        $existente = $modelo::query()
            ->where('empresa_id', $empresaId)
            ->whereRaw('LOWER(nombre) = ?', [mb_strtolower($nombre)])
            ->first();

        return $existente ?? $modelo::create(['empresa_id' => $empresaId, 'nombre' => $nombre]);
    }
}
