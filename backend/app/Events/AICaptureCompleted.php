<?php

namespace App\Events;

use App\Models\CapturaIA;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara cuando CapturaIAService::procesar() termina y la transacción
 * completa (productos + movimientos + captura + audit log) ya hizo commit.
 * Sin listeners todavía (sección 74 del master spec, punto 6) — pensado a
 * futuro para notificar al frontend en tiempo real o disparar reportes.
 */
class AICaptureCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly CapturaIA $captura,
    ) {
    }
}
