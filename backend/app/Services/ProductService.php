<?php

namespace App\Services;

use App\Events\ProductCreated;
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
            'categoria_id' => $datos['categoria_id'] ?? null,
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
     * @param array<string, mixed> $datos
     */
    public function resolverMarcaId(array $datos): ?int
    {
        if (! empty($datos['marca_id'])) {
            return (int) $datos['marca_id'];
        }

        $nombre = $datos['marca_nuevo'] ?? $datos['marca'] ?? null;

        if (empty($nombre)) {
            return null;
        }

        return $this->buscarOCrearCatalogo(Marca::class, (int) $datos['empresa_id'], $nombre)->id;
    }

    /**
     * Mismo tratamiento que resolverMarcaId() para `unidad_medida`
     * (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md).
     *
     * @param array<string, mixed> $datos
     */
    public function resolverUnidadMedidaId(array $datos): ?int
    {
        if (! empty($datos['unidad_medida_id'])) {
            return (int) $datos['unidad_medida_id'];
        }

        $nombre = $datos['unidad_medida_nuevo'] ?? $datos['unidad_medida'] ?? null;

        if (empty($nombre)) {
            return null;
        }

        return $this->buscarOCrearCatalogo(UnidadMedida::class, (int) $datos['empresa_id'], $nombre)->id;
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
