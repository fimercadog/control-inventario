<?php

namespace App\Services\Auth;

use App\Contracts\Auth\RefreshTokenServiceInterface;
use App\DTO\Auth\AuthResultDTO;
use App\Events\Auth\PasswordWasReset;
use App\Events\Auth\UserLoggedIn;
use App\Events\Auth\UserLoggedOut;
use App\Exceptions\Auth\AccountNotAvailableException;
use App\Exceptions\Auth\InvalidCredentialsException;
use App\Models\SecurityLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Único punto de entrada para login/logout/refresh (docs/04_ARCHITECTURE.md,
 * Módulo 1 — Authentication). Nunca genera tokens directamente: delega en
 * RefreshTokenServiceInterface. Cada intento de login (éxito o fallo) se
 * registra en security_logs sin excepción.
 */
class AuthenticationService
{
    public function __construct(
        private readonly RefreshTokenServiceInterface $tokens,
    ) {
    }

    /**
     * @throws InvalidCredentialsException
     * @throws AccountNotAvailableException
     */
    public function login(string $email, string $password, bool $rememberMe, ?string $ip, ?string $userAgent): AuthResultDTO
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            $this->recordAttempt($email, null, $ip, $userAgent, false, 'invalid_credentials');

            throw new InvalidCredentialsException();
        }

        if (! $user->is_active) {
            $this->recordAttempt($email, $user, $ip, $userAgent, false, 'account_inactive');

            throw new AccountNotAvailableException('inactive');
        }

        if (! $user->hasVerifiedEmail()) {
            $this->recordAttempt($email, $user, $ip, $userAgent, false, 'email_not_verified');

            throw new AccountNotAvailableException('unverified');
        }

        $result = DB::transaction(function () use ($user, $rememberMe, $ip, $userAgent) {
            $result = $this->tokens->issue($user, $rememberMe, $ip, $userAgent);

            $user->forceFill([
                'last_activity_at' => now(),
                'last_login_ip' => $ip,
                'last_user_agent' => $userAgent,
            ])->save();

            return $result;
        });

        $this->recordAttempt($email, $user, $ip, $userAgent, true, null);

        DB::afterCommit(fn () => event(new UserLoggedIn($user, $ip)));

        return $result;
    }

    public function logout(string $rawRefreshToken, User $user): void
    {
        $this->tokens->revoke($rawRefreshToken);
        auth('api')->invalidate();

        DB::afterCommit(fn () => event(new UserLoggedOut($user)));
    }

    public function refresh(string $rawRefreshToken, ?string $ip, ?string $userAgent): AuthResultDTO
    {
        $result = $this->tokens->rotate($rawRefreshToken, $ip, $userAgent);

        $result->user->forceFill(['last_activity_at' => now()])->save();

        return $result;
    }

    public function forcePasswordReset(User $user): void
    {
        $this->tokens->revokeAllForUser($user->id);

        DB::afterCommit(fn () => event(new PasswordWasReset($user)));
    }

    private function recordAttempt(
        string $email,
        ?User $user,
        ?string $ip,
        ?string $userAgent,
        bool $success,
        ?string $reason,
    ): void {
        SecurityLog::create([
            'email' => $email,
            'user_id' => $user?->id,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'success' => $success,
            'reason' => $reason,
        ]);
    }
}
