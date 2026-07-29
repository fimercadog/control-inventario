<?php

namespace App\Services;

use App\Events\ProductCreated;
use App\Models\Producto;
use App\Repositories\ProductRepository;
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
            'marca' => $datos['marca'] ?? null,
            'descripcion' => $datos['descripcion'] ?? null,
            'presentacion' => $datos['presentacion'] ?? null,
            'costo' => $datos['costo'] ?? 0,
            'precio' => $datos['precio'] ?? 0,
            'unidad_medida' => $datos['unidad_medida'] ?? null,
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
}
