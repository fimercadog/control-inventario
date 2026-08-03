<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\Role;
use App\Models\User;
use App\Notifications\Auth\InvitationNotification;
use App\Repositories\InvitationRepository;
use App\Services\Auth\TenantContext;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\PermissionRegistrar;

/**
 * Módulo 6 — Invitaciones (2026-08-03). Único mecanismo real de alta de
 * usuarios del ERP — ver Users.md, Decisión 1. El token crudo viaja por
 * correo y nunca se persiste: solo se guarda `hash('sha256', $token)`,
 * mismo principio que el broker de "olvidé mi contraseña" de Laravel
 * (comparar contra un hash irreversible, no contra el secreto en claro).
 */
class InvitationService
{
    private const DIAS_EXPIRACION = 7;

    public function __construct(
        private readonly InvitationRepository $invitaciones,
    ) {}

    public function crear(string $email, ?int $roleId, User $invitador): Invitation
    {
        $empresaId = $invitador->is_platform_admin
            ? throw ValidationException::withMessages(['email' => 'Un Platform Super Admin no puede invitar usuarios a una empresa.'])
            : $invitador->empresa_id;

        $this->invitaciones->invitacionesPendientesPara($email, $empresaId);

        $rawToken = Str::random(64);

        $invitacion = $this->invitaciones->crear([
            'email' => $email,
            'empresa_id' => $empresaId,
            'role_id' => $roleId,
            'token_hash' => hash('sha256', $rawToken),
            'invited_by' => $invitador->id,
            'expires_at' => now()->addDays(self::DIAS_EXPIRACION),
        ]);

        Notification::route('mail', $email)->notify(
            new InvitationNotification($rawToken, $invitador->empresa->nombre)
        );

        return $invitacion;
    }

    /**
     * @throws ValidationException si el token no existe, expiró, o ya fue aceptado
     */
    public function resolverPorToken(string $rawToken): Invitation
    {
        $invitacion = $this->invitaciones->porTokenHash(hash('sha256', $rawToken));

        if (! $invitacion) {
            throw ValidationException::withMessages(['token' => 'Esta invitación no existe o ya no es válida.']);
        }

        if ($invitacion->estaAceptada()) {
            throw ValidationException::withMessages(['token' => 'Esta invitación ya fue aceptada.']);
        }

        if ($invitacion->estaExpirada()) {
            throw ValidationException::withMessages(['token' => 'Esta invitación expiró. Pide a un administrador que te invite de nuevo.']);
        }

        return $invitacion;
    }

    public function aceptar(Invitation $invitacion, string $name, string $password): User
    {
        $usuario = User::create([
            'name' => $name,
            'email' => $invitacion->email,
            'password' => Hash::make($password),
            'empresa_id' => $invitacion->empresa_id,
            'invited_at' => $invitacion->created_at,
            'invited_by' => $invitacion->invited_by,
        ]);

        // `email_verified_at` no está en $fillable a propósito (nadie más
        // debe poder auto-verificar un correo vía mass-assignment) —
        // `forceFill()` explícito, mismo patrón ya usado por
        // PasswordResetController para `password`. La invitación llegó
        // únicamente a esta dirección de correo — aceptarla ya prueba su
        // titularidad, un segundo correo de verificación sería fricción
        // redundante sin beneficio real; y sin esto, AuthenticationService
        // ::login() rechazaría a este usuario con AccountNotAvailableException.
        $usuario->forceFill(['email_verified_at' => now()])->save();

        if ($invitacion->role_id) {
            // Esta ruta es pública (sin 'tenant' middleware, ver
            // InvitationController) — TenantContext nunca fue fijado por
            // IdentifyTenant, así que `Role` (BelongsToEmpresa/TenantScope)
            // quedaría fail-closed sin este set explícito. `empresa_id`
            // sale de la propia Invitation ya persistida, nunca de un
            // input del visitante — mismo patrón que un Job/Artisan
            // command fijándolo a mano (ver docblock de TenantContext).
            app(TenantContext::class)->setEmpresaId($invitacion->empresa_id);
            app(PermissionRegistrar::class)->setPermissionsTeamId($invitacion->empresa_id);
            $usuario->assignRole(Role::findOrFail($invitacion->role_id));
        }

        $this->invitaciones->marcarAceptada($invitacion);

        return $usuario;
    }
}
