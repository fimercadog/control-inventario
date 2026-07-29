<?php

namespace App\Events;

use App\Models\Movimiento;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara cada vez que InventoryService registra un movimiento, después
 * de que la transacción que lo contiene ya hizo commit. Sin listeners
 * todavía (sección 74 del master spec, punto 6).
 */
class InventoryMovementRegistered
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Movimiento $movimiento,
    ) {
    }
}
