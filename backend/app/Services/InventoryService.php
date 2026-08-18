<?php

namespace App\Services;

use App\Enums\TipoMovimiento;
use App\Events\InventoryMovementRegistered;
use App\Events\StockUpdated;
use App\Exceptions\StockInsuficienteException;
use App\Models\Bodega;
use App\Models\Movimiento;
use App\Models\Producto;
use App\Models\ProductoBodega;
use Illuminate\Validation\ValidationException;
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
        ?int $bodegaId = null,
    ): Movimiento {
        $cantidad = abs($cantidad);
        $delta = $cantidad * ($direccion ?? $this->direccion($tipo));

        return DB::transaction(function () use ($producto, $tipo, $cantidad, $delta, $documento, $observacion, $usuarioId, $costo, $precio, $proveedor, $lote, $vencimiento, $proveedorId, $bodegaId) {
            /** @var Producto $productoBloqueado */
            $productoBloqueado = Producto::query()
                ->whereKey($producto->getKey())
                ->lockForUpdate()
                ->firstOrFail();

            $stockAnterior = (float) $productoBloqueado->stock_actual;
            $stockNuevo = $stockAnterior + $delta;

            $bodega = $this->resolverBodega($productoBloqueado->empresa_id, $bodegaId);
            $saldoBodega = ProductoBodega::query()
                ->where('empresa_id', $productoBloqueado->empresa_id)
                ->where('producto_id', $productoBloqueado->id)
                ->where('bodega_id', $bodega->id)
                ->lockForUpdate()
                ->first();

            // Protege datos de pruebas y productos creados antes de que se
            // active multi-bodega: si aún no tienen saldo distribuido, el
            // saldo histórico pertenece a la bodega Principal.
            if ($saldoBodega === null) {
                $sinSaldosDistribuidos = ! ProductoBodega::query()
                    ->where('producto_id', $productoBloqueado->id)
                    ->exists();

                $saldoBodega = ProductoBodega::create([
                    'empresa_id' => $productoBloqueado->empresa_id,
                    'producto_id' => $productoBloqueado->id,
                    'bodega_id' => $bodega->id,
                    'stock_actual' => $sinSaldosDistribuidos && $bodega->es_principal ? $stockAnterior : 0,
                ]);
            }

            $stockBodegaAnterior = (float) $saldoBodega->stock_actual;
            $stockBodegaNuevo = $stockBodegaAnterior + $delta;

            if ($stockNuevo < 0) {
                throw new StockInsuficienteException(sprintf(
                    'Stock insuficiente para el producto #%d. Disponible: %s. Solicitado: %s.',
                    $productoBloqueado->id,
                    number_format($stockAnterior, 2),
                    number_format($cantidad, 2),
                ));
            }

            if ($stockBodegaNuevo < 0) {
                throw new StockInsuficienteException(sprintf(
                    'Stock insuficiente en la bodega %s para el producto #%d. Disponible: %s. Solicitado: %s.',
                    $bodega->nombre,
                    $productoBloqueado->id,
                    number_format($stockBodegaAnterior, 2),
                    number_format($cantidad, 2),
                ));
            }

            $productoBloqueado->stock_actual = $stockNuevo;

            // Un producto agotado deja de estar disponible en las interfaces
            // que solo muestran catálogo activo. La marca adicional evita
            // reactivar por accidente un producto que fue inhabilitado
            // manualmente por un administrador. Una entrada, foto, audio o
            // ajuste positivo repone y reactiva únicamente los agotados por
            // stock.
            if ($stockNuevo === 0.0 && $productoBloqueado->estado === 'activo') {
                $productoBloqueado->estado = 'inactivo';
                $productoBloqueado->inhabilitado_por_stock = true;
            } elseif ($stockNuevo > 0.0 && $productoBloqueado->inhabilitado_por_stock) {
                $productoBloqueado->estado = 'activo';
                $productoBloqueado->inhabilitado_por_stock = false;
            }
            $productoBloqueado->save();
            $saldoBodega->stock_actual = $stockBodegaNuevo;
            $saldoBodega->save();

            $movimiento = Movimiento::create([
                'empresa_id' => $productoBloqueado->empresa_id,
                'producto_id' => $productoBloqueado->id,
                'bodega_id' => $bodega->id,
                'usuario_id' => $usuarioId,
                'tipo' => $tipo->value,
                'documento' => $documento,
                'cantidad' => $cantidad,
                // El ledger conserva el saldo del ámbito donde ocurrió el
                // movimiento (la bodega); el producto mantiene el total
                // consolidado para compatibilidad con los consumidores ya
                // existentes de productos.stock_actual.
                'stock_anterior' => $stockBodegaAnterior,
                'stock_nuevo' => $stockBodegaNuevo,
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

    private function resolverBodega(int $empresaId, ?int $bodegaId): Bodega
    {
        if ($bodegaId !== null) {
            $bodega = Bodega::query()
                ->whereKey($bodegaId)
                ->where('empresa_id', $empresaId)
                ->lockForUpdate()
                ->firstOrFail();
        } else {
            $bodega = Bodega::query()
                ->where('empresa_id', $empresaId)
                ->where('es_principal', true)
                ->lockForUpdate()
                ->first();

            if ($bodega === null) {
                $bodega = Bodega::firstOrCreate(
                    ['empresa_id' => $empresaId, 'nombre' => 'Principal'],
                    ['es_principal' => true, 'estado' => 'activo'],
                );
            }
        }

        if ($bodega->estado !== 'activo') {
            throw ValidationException::withMessages([
                'bodega_id' => ['La bodega seleccionada está inactiva.'],
            ]);
        }

        return $bodega;
    }
}
