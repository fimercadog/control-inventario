<?php

namespace App\DTO\Auth;

use App\Models\User;

/**
 * Resultado de emitir o rotar un par de tokens: quién es el usuario y con
 * qué tokens queda autenticado. `rotate()` descubre el usuario a partir del
 * refresh token guardado, no lo recibe del caller — por eso ambos viajan
 * juntos en vez de que el caller tenga que recordarlo por separado.
 */
final readonly class AuthResultDTO
{
    public function __construct(
        public User $user,
        public TokenPairDTO $tokens,
    ) {
    }
}
