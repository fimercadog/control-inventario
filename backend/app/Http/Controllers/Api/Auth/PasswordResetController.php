<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Support\ApiResponse;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use App\Services\Auth\AuthenticationService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

/**
 * "Olvidé mi contraseña" (docs/06_API.md, Módulo 1). Siempre responde
 * genérico en /olvide, exista o no ese correo — nunca se revela si un
 * email está registrado (protección contra enumeración de usuarios).
 */
class PasswordResetController extends Controller
{
    public function __construct(
        private readonly AuthenticationService $auth,
        private readonly AuditLogger $auditoria,
    ) {
    }

    public function olvide(ForgotPasswordRequest $request): JsonResponse
    {
        Password::sendResetLink($request->only('email'));

        return ApiResponse::success(null, 'Si ese correo existe, enviamos un enlace para restablecer la contraseña.');
    }

    public function restablecer(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) use ($request) {
                $user->forceFill(['password' => Hash::make($password)])->save();

                $this->auth->forcePasswordReset($user);

                $this->registrarAuditoria($request, $user);

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return ApiResponse::error('No pudimos restablecer tu contraseña. El enlace puede haber expirado.', [], 422);
        }

        return ApiResponse::success(null, 'Tu contraseña fue restablecida correctamente.');
    }

    /**
     * Auditoría 2026-08-09: `ProfileService::cambiarPassword()` (cambio
     * self-service) ya auditaba `perfil.password_cambiado` con el mismo
     * patrón (nunca el valor real, solo la marca) — este flujo (recuperar
     * contraseña olvidada) no auditaba nada en absoluto, inconsistencia
     * real cerrada aquí, no una regla nueva inventada.
     *
     * `password/restablecer` es una ruta pública — no hay usuario
     * autenticado, así que nada ambiental resuelve `empresa_id` aquí.
     * `registrarAccionManual()` lo recibe explícito (`empresaId:` abajo) y
     * lo escribe directo en `AuditLog::create()`, sin depender del guard ni
     * de `BelongsToEmpresa` — se usa el `empresa_id` del usuario ya resuelto
     * de forma segura por el Password Broker (token+email verificados, no
     * el payload crudo).
     */
    private function registrarAuditoria(Request $request, User $user): void
    {
        if ($user->empresa_id === null) {
            // Platform admin sin empresa — mismo criterio que ProfileService,
            // se omite en vez de forzar un empresa_id falso.
            return;
        }

        $this->auditoria->registrarAccionManual(
            empresaId: $user->empresa_id,
            usuarioId: $user->id,
            modulo: 'auth',
            accion: 'auth.password_restablecido',
            auditableType: User::class,
            auditableId: $user->id,
            valoresNuevos: ['password' => '(restablecido)'],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
