<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Support\ApiResponse;
use App\Models\User;
use App\Services\Auth\AuthenticationService;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
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
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();

                $this->auth->forcePasswordReset($user);

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return ApiResponse::error('No pudimos restablecer tu contraseña. El enlace puede haber expirado.', [], 422);
        }

        return ApiResponse::success(null, 'Tu contraseña fue restablecida correctamente.');
    }
}
