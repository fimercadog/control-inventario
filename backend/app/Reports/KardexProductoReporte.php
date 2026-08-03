<?php

namespace App\Reports;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Reports\Concerns\AplicaPaginacion;
use Illuminate\Validation\ValidationException;

/**
 * "Kardex by Product" — ledger cronológico de UN producto. `stock_anterior`/
 * `stock_nuevo` ya están guardados en cada `Movimiento` (calculados por
 * `InventoryService` al momento de escribir) — este reporte no recalcula
 * el saldo, solo lo lee en el orden correcto.
 */
class KardexProductoReporte implements Reporte
{
    use AplicaPaginacion;

    public function clave(): string
    {
        return 'kardex-producto';
    }

    public function nombre(): string
    {
        return 'Kardex por Producto';
    }

    public function descripcion(): string
    {
        return 'Ledger cronológico de entradas, salidas y ajustes de un producto específico, con saldo corrido.';
    }

    public function filtrosDisponibles(): array
    {
        return [
            ['clave' => 'producto_id', 'etiqueta' => 'Producto', 'tipo' => 'select', 'requerido' => true],
            ['clave' => 'desde', 'etiqueta' => 'Desde', 'tipo' => 'fecha', 'requerido' => false],
            ['clave' => 'hasta', 'etiqueta' => 'Hasta', 'tipo' => 'fecha', 'requerido' => false],
        ];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        if (empty($filtros['producto_id'])) {
            throw ValidationException::withMessages(['producto_id' => 'Selecciona un producto para ver su kardex.']);
        }

        $producto = Producto::findOrFail($filtros['producto_id']);

        $query = Movimiento::query()
            ->where('producto_id', $producto->id)
            ->when($filtros['desde'] ?? null, fn ($q, $v) => $q->where('created_at', '>=', $v))
            ->when($filtros['hasta'] ?? null, fn ($q, $v) => $q->where('created_at', '<=', "{$v} 23:59:59"))
            ->oldest('created_at');

        ['filas' => $movimientos, 'total' => $total] = $this->paginarConsulta($query, $filtros, $paginado);

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: "Kardex — {$producto->nombre}",
            columnas: [
                ['clave' => 'fecha', 'etiqueta' => 'Fecha'],
                ['clave' => 'tipo', 'etiqueta' => 'Tipo'],
                ['clave' => 'documento', 'etiqueta' => 'Documento'],
                ['clave' => 'entrada', 'etiqueta' => 'Entrada'],
                ['clave' => 'salida', 'etiqueta' => 'Salida'],
                ['clave' => 'saldo', 'etiqueta' => 'Saldo'],
            ],
            filas: array_map(fn (Movimiento $m) => [
                'fecha' => $m->created_at->format('Y-m-d H:i'),
                'tipo' => ucfirst($m->tipo),
                'documento' => $m->documento ?? '—',
                'entrada' => $m->tipo === 'entrada' || ($m->tipo === 'ajuste' && $m->stock_nuevo > $m->stock_anterior) ? (float) $m->cantidad : null,
                'salida' => $m->tipo === 'salida' || ($m->tipo === 'ajuste' && $m->stock_nuevo < $m->stock_anterior) ? (float) $m->cantidad : null,
                'saldo' => (float) $m->stock_nuevo,
            ], $movimientos),
            resumen: ['producto' => $producto->nombre, 'codigo' => $producto->codigo, 'stock_actual' => (float) $producto->stock_actual],
            filtrosAplicados: $filtros,
            total: $total,
        );
    }
}
