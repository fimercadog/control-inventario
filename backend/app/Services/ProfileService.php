<?php

namespace App\Services;

use App\Models\User;
use App\Services\Audit\AuditLogger;
use App\Services\Auth\AuthenticationService;
use Illuminate\Http\Request;
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
 *
 * Auditoría agregada 2026-08-04 (auditoría de campos editables de
 * Clientes/Proveedores/Usuarios): antes de este cambio, ninguna
 * automodificación de perfil quedaba registrada en `AuditLog`, a
 * diferencia de las mutaciones de `UserController` (activar/desactivar/
 * asignarRol) — inconsistencia real frente a
 * `docs/10_GOVERNANCE/DefinitionOfDone.md` ("toda mutación exitosa escribe
 * una entrada real vía AuditLogger").
 */
class ProfileService
{
    private const DISCO_AVATARES = 'public';

    public function __construct(
        private readonly AuthenticationService $auth,
        private readonly AuditLogger $auditoria,
    ) {}

    /**
     * @param  array{theme?: string, language?: string, timezone?: string}  $datos
     */
    public function actualizar(User $user, array $datos, Request $request): User
    {
        $user->fill($datos);
        $user->save();

        $cambios = collect($user->getChanges())->except('updated_at')->all();

        if ($cambios !== []) {
            $this->registrarAuditoria($request, $user, 'perfil.editar', $cambios);
        }

        return $user;
    }

    public function actualizarAvatar(User $user, UploadedFile $archivo, Request $request): User
    {
        $this->eliminarArchivoAvatar($user);

        // Se guarda la ruta relativa (no la URL completa) — `avatar_path`
        // es una ruta de Storage, no una URL; `AuthenticatedUserResource`
        // computa `avatar_url` a partir de esto cuando hace falta servirla.
        $ruta = $archivo->store("avatares/{$user->empresa_id}", self::DISCO_AVATARES);
        $user->forceFill(['avatar_path' => $ruta])->save();

        $this->registrarAuditoria($request, $user, 'perfil.avatar_actualizado', ['avatar_path' => $ruta]);

        return $user;
    }

    public function eliminarAvatar(User $user, Request $request): User
    {
        $this->eliminarArchivoAvatar($user);
        $user->forceFill(['avatar_path' => null])->save();

        $this->registrarAuditoria($request, $user, 'perfil.avatar_eliminado', ['avatar_path' => null]);

        return $user;
    }

    /**
     * Revoca todas las sesiones del usuario tras el cambio — mismo
     * mecanismo que "olvidé mi contraseña"
     * (`AuthenticationService::forcePasswordReset()`), reutilizado en vez
     * de duplicado: cambiar la contraseña propia es, en los hechos, el
     * mismo evento de seguridad.
     */
    public function cambiarPassword(User $user, string $passwordNuevo, Request $request): void
    {
        $user->forceFill(['password' => Hash::make($passwordNuevo)])->save();

        // Nunca el hash ni el valor real — solo la marca de que ocurrió
        // (Security Reviewer: contraseñas/claves nunca en texto plano ni
        // hasheado dentro de un log, ver docs/13_ROLES/SECURITY_REVIEWER.md).
        $this->registrarAuditoria($request, $user, 'perfil.password_cambiado', ['password' => '(cambiado)']);

        $this->auth->forcePasswordReset($user);
    }

    /**
     * @param  array<string, mixed>  $valoresNuevos
     */
    private function registrarAuditoria(Request $request, User $user, string $accion, array $valoresNuevos): void
    {
        if ($user->empresa_id === null) {
            // Platform admin sin empresa — no hay tenant al que asociar el
            // log; se omite en vez de forzar un empresa_id falso.
            return;
        }

        $this->auditoria->registrarAccionManual(
            empresaId: $user->empresa_id,
            usuarioId: $user->id,
            modulo: 'perfil',
            accion: $accion,
            auditableType: User::class,
            auditableId: $user->id,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }

    private function eliminarArchivoAvatar(User $user): void
    {
        if ($user->avatar_path !== null) {
            Storage::disk(self::DISCO_AVATARES)->delete($user->avatar_path);
        }
    }
}
