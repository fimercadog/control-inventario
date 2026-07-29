<?php

namespace App\Events\Auth;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara tras un login exitoso, después de que la transacción hizo
 * commit. Alimenta audit_logs (Módulo 8) — a diferencia de Captura IA, en
 * este módulo los listeners se construyen desde ya.
 */
class UserLoggedIn
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly ?string $ip,
    ) {
    }
}
