<?php

namespace App\Events;

use App\Models\Producto;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara después de que ProductService da de alta un producto y la
 * transacción que lo contiene ya hizo commit. Sin listeners todavía
 * (sección 74 del master spec, punto 6) — solo la arquitectura de eventos.
 */
class ProductCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Producto $producto,
    ) {
    }
}
