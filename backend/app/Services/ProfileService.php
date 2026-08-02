<?php

namespace App\Services;

use App\Models\User;
use App\Services\Auth\AuthenticationService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * Perfil (2026-08-02, docs/03_FUNCTIONAL_SPEC/Profile.md). Todo método
 * opera exclusivamente sobre el propio usuario autenticado — nunca recibe
 * un id de otro usuario, a diferencia de `UserService`/`UserController`
 * (gestión de otros usuarios de la empresa, Módulo 4). No hay Repository:
 * son mutaciones de un único registro ya cargado (`$request->user()`),
 * sin necesidad de encapsular una consulta.
 */
class ProfileService
{
    private const DISCO_AVATARES = 'public';

    public function __construct(
        private readonly AuthenticationService $auth,
    ) {
    }

    /**
     * @param array{name?: string, theme?: string, language?: string, timezone?: string} $datos
     */
    public function actualizar(User $user, array $datos): User
    {
        $user->fill($datos);
        $user->save();

        return $user;
    }

    public function actualizarAvatar(User $user, UploadedFile $archivo): User
    {
        $this->eliminarArchivoAvatar($user);

        // Se guarda la ruta relativa (no la URL completa) — `avatar_path`
        // es una ruta de Storage, no una URL; `AuthenticatedUserResource`
        // computa `avatar_url` a partir de esto cuando hace falta servirla.
        $ruta = $archivo->store("avatares/{$user->empresa_id}", self::DISCO_AVATARES);
        $user->forceFill(['avatar_path' => $ruta])->save();

        return $user;
    }

    public function eliminarAvatar(User $user): User
    {
        $this->eliminarArchivoAvatar($user);
        $user->forceFill(['avatar_path' => null])->save();

        return $user;
    }

    /**
     * Revoca todas las sesiones del usuario tras el cambio — mismo
     * mecanismo que "olvidé mi contraseña"
     * (`AuthenticationService::forcePasswordReset()`), reutilizado en vez
     * de duplicado: cambiar la contraseña propia es, en los hechos, el
     * mismo evento de seguridad.
     */
    public function cambiarPassword(User $user, string $passwordNuevo): void
    {
        $user->forceFill(['password' => Hash::make($passwordNuevo)])->save();

        $this->auth->forcePasswordReset($user);
    }

    private function eliminarArchivoAvatar(User $user): void
    {
        if ($user->avatar_path !== null) {
            Storage::disk(self::DISCO_AVATARES)->delete($user->avatar_path);
        }
    }
}
