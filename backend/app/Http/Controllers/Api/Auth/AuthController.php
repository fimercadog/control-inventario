<?php

namespace App\Http\Controllers\Api\Auth;

use App\DTO\Auth\AuthResultDTO;
use App\DTO\Auth\TokenPairDTO;
use App\Exceptions\Auth\InvalidRefreshTokenException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\Auth\AuthenticatedUserResource;
use App\Http\Support\ApiResponse;
use App\Models\User;
use App\Services\Auth\AuthenticationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\PermissionRegistrar;
use Symfony\Component\HttpFoundation\Cookie;

/**
 * Sesión (docs/06_API.md, Módulo Auth & RBAC — Módulo 1). El access token
 * viaja en el body (memoria del cliente, nunca localStorage); el refresh
 * token viaja únicamente en una cookie httpOnly — este Controller es el
 * único lugar que la lee o la escribe.
 */
class AuthController extends Controller
{
    public function __construct(
        private readonly AuthenticationService $auth,
    ) {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->auth->login(
            email: $request->string('email')->toString(),
            password: $request->string('password')->toString(),
            rememberMe: $request->boolean('remember_me'),
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return $this->respuestaConTokens($result);
    }

    public function logout(Request $request): JsonResponse
    {
        $rawRefreshToken = $request->cookie(config('auth_sessions.cookie_name'));

        if ($rawRefreshToken) {
            $this->auth->logout($rawRefreshToken, $request->user());
        }

        return ApiResponse::success(null, 'Sesión cerrada correctamente.')
            ->withCookie($this->cookieExpirada());
    }

    public function refresh(Request $request): JsonResponse
    {
        $rawRefreshToken = $request->cookie(config('auth_sessions.cookie_name'));

        if (! $rawRefreshToken) {
            throw new InvalidRefreshTokenException();
        }

        $result = $this->auth->refresh($rawRefreshToken, $request->ip(), $request->userAgent());

        return $this->respuestaConTokens($result);
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success(new AuthenticatedUserResource($request->user()));
    }

    private function respuestaConTokens(AuthResultDTO $result): JsonResponse
    {
        // `login`/`refresh` viven fuera de ['auth:api', 'empresa'] a propósito
        // (no existe token todavía al empezar la request) — así que
        // `IdentifyEmpresa` nunca corre para fijar el team de Spatie antes
        // de esta respuesta. Sin este paso, `AuthenticatedUserResource`
        // siempre mostraría `role: null` y `permissions: []`, sin importar
        // los roles/permisos reales del usuario.
        $this->fijarTeamDePermisos($result->user);

        $data = new AuthenticatedUserResource($result->user);

        return ApiResponse::success([
            'access_token' => $result->tokens->accessToken,
            'token_type' => 'Bearer',
            'expires_in' => $result->tokens->accessTokenExpiresInSeconds,
            'user' => $data,
        ])->withCookie($this->cookieDeSesion($result->tokens));
    }

    /** Mismo criterio que App\Http\Middleware\IdentifyEmpresa, aplicado a mano. */
    private function fijarTeamDePermisos(User $user): void
    {
        app(PermissionRegistrar::class)->setPermissionsTeamId(
            $user->is_platform_admin ? null : $user->empresa_id
        );
    }

    private function cookieDeSesion(TokenPairDTO $tokens): Cookie
    {
        return cookie(
            name: config('auth_sessions.cookie_name'),
            value: $tokens->refreshToken,
            // Sin "Recordar" la cookie termina al cerrar el navegador. La sesión del
            // servidor conserva además su TTL normal de seguridad (7 días por defecto).
            minutes: $tokens->rememberMe
                ? config('auth_sessions.refresh_ttl_remember_days') * 24 * 60
                : 0,
            path: '/',
            domain: null,
            secure: config('auth_sessions.cookie_secure'),
            httpOnly: true,
            raw: false,
            sameSite: config('auth_sessions.cookie_same_site'),
        );
    }

    private function cookieExpirada(): Cookie
    {
        return cookie(
            name: config('auth_sessions.cookie_name'),
            value: '',
            minutes: -1,
            path: '/',
            domain: null,
            secure: config('auth_sessions.cookie_secure'),
            httpOnly: true,
            raw: false,
            sameSite: config('auth_sessions.cookie_same_site'),
        );
    }
}
