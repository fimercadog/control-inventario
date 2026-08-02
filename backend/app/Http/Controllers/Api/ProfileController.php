<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\ChangePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Requests\Profile\UploadAvatarRequest;
use App\Http\Resources\Auth\AuthenticatedUserResource;
use App\Http\Support\ApiResponse;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Perfil (2026-08-02, docs/03_FUNCTIONAL_SPEC/Profile.md). Todo método
 * opera exclusivamente sobre `$request->user()` — nunca recibe ni acepta
 * un id de otro usuario en la ruta, a diferencia de `UserController`
 * (Módulo 4, gestión de otros usuarios de la empresa). Sin `index`/`show`:
 * `GET /auth/me` ya es la fuente de verdad de la ficha propia.
 */
class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $perfil,
    ) {
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->perfil->actualizar($request->user(), $request->validated());

        return ApiResponse::success(new AuthenticatedUserResource($user), 'Perfil actualizado correctamente');
    }

    public function subirAvatar(UploadAvatarRequest $request): JsonResponse
    {
        $user = $this->perfil->actualizarAvatar($request->user(), $request->file('avatar'));

        return ApiResponse::success(new AuthenticatedUserResource($user), 'Avatar actualizado correctamente');
    }

    public function eliminarAvatar(Request $request): JsonResponse
    {
        $user = $this->perfil->eliminarAvatar($request->user());

        return ApiResponse::success(new AuthenticatedUserResource($user), 'Avatar eliminado correctamente');
    }

    /**
     * Revoca todas las sesiones del usuario (mismo mecanismo que "olvidé
     * mi contraseña") — el frontend debe redirigir a /login tras un 200,
     * el access token en memoria dejará de servir en cuanto expire.
     */
    public function cambiarPassword(ChangePasswordRequest $request): JsonResponse
    {
        $this->perfil->cambiarPassword($request->user(), $request->string('password')->toString());

        return ApiResponse::success(null, 'Contraseña actualizada correctamente. Inicia sesión de nuevo.');
    }
}
