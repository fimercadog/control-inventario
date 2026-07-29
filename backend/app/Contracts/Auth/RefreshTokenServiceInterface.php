<?php

namespace App\Contracts\Auth;

use App\DTO\Auth\AuthResultDTO;
use App\Exceptions\Auth\InvalidRefreshTokenException;
use App\Models\User;

/**
 * Única puerta de entrada al par access/refresh token. AuthenticationService
 * nunca genera JWTs ni tokens opacos por su cuenta — siempre pasa por aquí,
 * para que la rotación y revocación queden en un solo lugar (docs/04_ARCHITECTURE.md,
 * "Flujo de tokens").
 */
interface RefreshTokenServiceInterface
{
    public function issue(User $user, bool $rememberMe, ?string $ip, ?string $userAgent): AuthResultDTO;

    /**
     * Valida el refresh token recibido, lo revoca (nunca se reutiliza) y
     * emite un par nuevo para el mismo usuario.
     *
     * @throws InvalidRefreshTokenException si el token no existe, ya fue
     *                                       revocado, o expiró.
     */
    public function rotate(string $rawRefreshToken, ?string $ip, ?string $userAgent): AuthResultDTO;

    public function revoke(string $rawRefreshToken): void;

    public function revokeAllForUser(int $userId): void;
}
