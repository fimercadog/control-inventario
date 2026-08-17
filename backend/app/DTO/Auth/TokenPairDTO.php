<?php

namespace App\DTO\Auth;

/**
 * Par de tokens emitido en login/refresh. `refreshToken` es el valor RAW
 * en texto plano — existe únicamente en memoria durante esta request; lo
 * único que se persiste en auth_sessions es su hash (ver RefreshTokenService).
 */
final readonly class TokenPairDTO
{
    public function __construct(
        public string $accessToken,
        public int $accessTokenExpiresInSeconds,
        public string $refreshToken,
    ) {
    }
}
