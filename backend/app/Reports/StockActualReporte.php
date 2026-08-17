<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Models\Producto;
use App\Reports\Concerns\AplicaPaginacion;

/** "Current Stock" — listado completo de productos con su stock actual. */
class StockActualReporte implements Reporte
{
    use AplicaPaginacion;
    use FiltersByEmpresa;

    public function clave(): string
    {
        return 'stock-actual';
    }

    public function nombre(): string
    {
        return 'Stock Actual';
    }

    public function descripcion(): string
    {
        return 'Listado de productos activos con su nivel de stock actual, mínimo y máximo.';
    }

    public function filtrosDisponibles(): array
    {
        return [
            ['clave' => 'categoria_id', 'etiqueta' => 'Categoría', 'tipo' => 'select', 'requerido' => false],
            ['clave' => 'marca_id', 'etiqueta' => 'Marca', 'tipo' => 'select', 'requerido' => false],
            ['clave' => 'busqueda', 'etiqueta' => 'Buscar por nombre o código', 'tipo' => 'texto', 'requerido' => false],
        ];
    }

    /**
     * Expuesto `protected` a propósito: `StockBajoReporte` lo reutiliza y
     * le agrega un único `whereColumn`, en vez de duplicar esta consulta.
     */
    protected function construirConsulta(array $filtros)
    {
        return $this->paraEmpresaActual(Producto::query())
            ->where('estado', 'activo')
            ->with(['categoria:id,nombre', 'marca:id,nombre'])
            ->when($filtros['categoria_id'] ?? null, fn ($q, $v) => $q->where('categoria_id', $v))
            ->when($filtros['marca_id'] ?? null, fn ($q, $v) => $q->where('marca_id', $v))
            ->when($filtros['busqueda'] ?? null, fn ($q, $v) => $q->where(function ($sub) use ($v) {
                $sub->where('nombre', 'like', "%{$v}%")->orWhere('codigo', 'like', "%{$v}%");
            }))
            ->orderBy('nombre');
    }

    /** @return array<int, array{clave: string, etiqueta: string}> */
    protected function columnas(): array
    {
        return [
            ['clave' => 'codigo', 'etiqueta' => 'Código'],
            ['clave' => 'nombre', 'etiqueta' => 'Producto'],
            ['clave' => 'categoria', 'etiqueta' => 'Categoría'],
            ['clave' => 'marca', 'etiqueta' => 'Marca'],
            ['clave' => 'stock_actual', 'etiqueta' => 'Stock actual'],
            ['clave' => 'stock_minimo', 'etiqueta' => 'Stock mínimo'],
            ['clave' => 'stock_maximo', 'etiqueta' => 'Stock máximo'],
            ['clave' => 'estado_stock', 'etiqueta' => 'Estado'],
        ];
    }

    /** @return array<string, mixed> */
    protected function mapearFila(Producto $p): array
    {
        return [
            'codigo' => $p->codigo,
            'nombre' => $p->nombre,
            'categoria' => $p->categoria?->nombre ?? '—',
            'marca' => $p->marca?->nombre ?? '—',
            'stock_actual' => (float) $p->stock_actual,
            'stock_minimo' => (float) $p->stock_minimo,
            'stock_maximo' => $p->stock_maximo !== null ? (float) $p->stock_maximo : null,
            'estado_stock' => $p->stock_actual <= 0 ? 'Sin stock' : ($p->stock_actual <= $p->stock_minimo ? 'Bajo' : 'Normal'),
        ];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $query = $this->construirConsulta($filtros);

        ['filas' => $productos, 'total' => $total] = $this->paginarConsulta($query, $filtros, $paginado);

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: $this->columnas(),
            filas: array_map($this->mapearFila(...), $productos),
            filtrosAplicados: $filtros,
            total: $total,
        );
    }
}
