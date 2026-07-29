<?php

namespace App\Events\Auth;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Se dispara después de restablecer la contraseña, cuando ya se revocaron
 * todas las auth_sessions del usuario (docs/04_ARCHITECTURE.md).
 */
class PasswordWasReset
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly User $user,
    ) {
    }
}
