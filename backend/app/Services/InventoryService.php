<?php

namespace App\Services;

use App\Enums\TipoMovimiento;
use App\Events\InventoryMovementRegistered;
use App\Events\StockUpdated;
use App\Exceptions\StockInsuficienteException;
use App\Models\Movimiento;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;

/**
 * Única vía de escritura de `productos.stock_actual` y de la tabla
 * `movimientos` en todo el sistema (secciones 23, 24 y 74 del master spec).
 * Ni ProductService ni Captura IA tocan stock_actual directamente, y
 * ninguno de los dos decide si un tipo de movimiento suma o resta: esa
 * regla es de Inventario y vive únicamente aquí (sección 74, "Captura IA
 * nunca contiene reglas de negocio").
 */
class InventoryService
{
    /**
     * @param  float  $cantidad  Magnitud siempre positiva. La dirección
     *                           (sumar o restar) la decide este Service según
     *                           $tipo, nunca el llamador — excepto para
     *                           Ajuste, el único tipo inherentemente
     *                           bidireccional (un conteo físico puede
     *                           encontrar más o menos stock del esperado),
     *                           donde el llamador debe pasar $direccion
     *                           explícitamente (+1/-1). Para todo lo demás,
     *                           $direccion debe quedar en null y la dirección
     *                           la sigue decidiendo direccion($tipo) como
     *                           siempre (RC1 Fase 3, docs/03_FUNCTIONAL_SPEC/Movements.md).
     */
    public function registrarMovimiento(
        Producto $producto,
        TipoMovimiento $tipo,
        float $cantidad,
        ?string $documento = null,
        ?string $observacion = null,
        ?int $usuarioId = null,
        ?float $costo = null,
        ?float $precio = null,
        ?string $proveedor = null,
        ?string $lote = null,
        ?string $vencimiento = null,
        ?int $proveedorId = null,
        ?int $direccion = null,
    ): Movimiento {
        $cantidad = abs($cantidad);
        $delta = $cantidad * ($direccion ?? $this->direccion($tipo));

        return DB::transaction(function () use ($producto, $tipo, $cantidad, $delta, $documento, $observacion, $usuarioId, $costo, $precio, $proveedor, $lote, $vencimiento, $proveedorId) {
            /** @var Producto $productoBloqueado */
            $productoBloqueado = Producto::query()
                ->whereKey($producto->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $stockAnterior = (float) $productoBloqueado->stock_actual;
            $stockNuevo = $stockAnterior + $delta;

            if ($stockNuevo < 0) {
                throw new StockInsuficienteException(sprintf(
                    'Stock insuficiente para el producto #%d. Disponible: %s. Solicitado: %s.',
                    $productoBloqueado->id,
                    number_format($stockAnterior, 2),
                    number_format($cantidad, 2),
                ));
            }

            $productoBloqueado->stock_actual = $stockNuevo;
            $productoBloqueado->save();

            $movimiento = Movimiento::create([
                'empresa_id' => $productoBloqueado->empresa_id,
                'producto_id' => $productoBloqueado->id,
                'usuario_id' => $usuarioId,
                'tipo' => $tipo->value,
                'documento' => $documento,
                'cantidad' => $cantidad,
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'costo' => $costo,
                'precio' => $precio,
                'observacion' => $observacion,
                'proveedor' => $proveedor,
                'proveedor_id' => $proveedorId,
                'lote' => $lote,
                'vencimiento' => $vencimiento,
            ]);

            // afterCommit: si este movimiento es parte de una transacción más
            // grande (el pipeline completo de Captura IA) y esa transacción
            // termina en rollback, los eventos nunca se disparan — se
            // difieren automáticamente hasta el commit MÁS externo
            // (sección 74, punto 6, "después de completar exitosamente").
            DB::afterCommit(fn () => event(new StockUpdated($productoBloqueado, $stockAnterior, $stockNuevo)));
            DB::afterCommit(fn () => event(new InventoryMovementRegistered($movimiento)));

            return $movimiento;
        });
    }

    /**
     * Entrada, Conteo y Transferencia suman por defecto en este MVP de un
     * solo almacén; Salida resta. Ajuste normalmente llega con
     * $direccion explícito desde MovimientoController (RC1 Fase 3) — este
     * default solo aplica si algún llamador antiguo (p. ej. Captura IA)
     * lo invoca sin especificarla, y mantiene el comportamiento histórico
     * (+1) para no romper nada existente. Una transferencia con
     * origen/destino real es de un futuro módulo de Compras/Ventas
     * (sección 25-28) y podrá refinar esta regla sin que Captura IA se
     * entere.
     */
    private function direccion(TipoMovimiento $tipo): int
    {
        return match ($tipo) {
            TipoMovimiento::Salida => -1,
            default => 1,
        };
    }
}
