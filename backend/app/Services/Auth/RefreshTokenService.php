<?php

namespace App\Services\Auth;

use App\Contracts\Auth\RefreshTokenServiceInterface;
use App\DTO\Auth\AuthResultDTO;
use App\DTO\Auth\TokenPairDTO;
use App\Exceptions\Auth\InvalidRefreshTokenException;
use App\Models\AuthSession;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class RefreshTokenService implements RefreshTokenServiceInterface
{
    public function issue(User $user, bool $rememberMe, ?string $ip, ?string $userAgent): AuthResultDTO
    {
        return new AuthResultDTO($user, $this->issueFor($user, $rememberMe, $ip, $userAgent));
    }

    public function rotate(string $rawRefreshToken, ?string $ip, ?string $userAgent): AuthResultDTO
    {
        $hash = $this->hash($rawRefreshToken);

        $session = AuthSession::where('refresh_token_hash', $hash)->first();

        if (! $session || ! $session->isActive()) {
            throw new InvalidRefreshTokenException();
        }

        $session->update(['revoked_at' => now()]);

        $user = $session->user;

        return new AuthResultDTO($user, $this->issueFor($user, $session->remember_me, $ip, $userAgent));
    }

    public function revoke(string $rawRefreshToken): void
    {
        AuthSession::where('refresh_token_hash', $this->hash($rawRefreshToken))
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    public function revokeAllForUser(int $userId): void
    {
        AuthSession::where('user_id', $userId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    private function issueFor(User $user, bool $rememberMe, ?string $ip, ?string $userAgent): TokenPairDTO
    {
        $rawToken = Str::random(64);
        $ttlDays = $rememberMe
            ? config('auth_sessions.refresh_ttl_remember_days')
            : config('auth_sessions.refresh_ttl_days');

        AuthSession::create([
            'user_id' => $user->id,
            'refresh_token_hash' => $this->hash($rawToken),
            'device_name' => $this->deviceNameFrom($userAgent),
            'ip_address' => $ip,
            'remember_me' => $rememberMe,
            'last_used_at' => now(),
            'expires_at' => Carbon::now()->addDays($ttlDays),
        ]);

        $accessToken = JWTAuth::fromUser($user);

        return new TokenPairDTO(
            accessToken: $accessToken,
            accessTokenExpiresInSeconds: (int) config('jwt.ttl') * 60,
            refreshToken: $rawToken,
        );
    }

    private function hash(string $rawToken): string
    {
        return hash('sha256', $rawToken);
    }

    private function deviceNameFrom(?string $userAgent): ?string
    {
        return $userAgent ? Str::limit($userAgent, 255, '') : null;
    }
}
