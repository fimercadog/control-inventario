<?php

namespace App\Events;

use App\Models\Producto;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara cada vez que InventoryService cambia stock_actual, después de
 * que la transacción que lo contiene ya hizo commit. Sin listeners todavía
 * (sección 74 del master spec, punto 6) — pensado a futuro para alertas de
 * stock mínimo/máximo (sección 23).
 */
class StockUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Producto $producto,
        public readonly float $stockAnterior,
        public readonly float $stockNuevo,
    ) {
    }
}
