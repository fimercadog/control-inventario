<?php

namespace App\Services;

use App\Models\Invitation;
use App\Models\Role;
use App\Models\User;
use App\Notifications\Auth\InvitationNotification;
use App\Repositories\InvitationRepository;
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

    public function crear(string $email, string $name, ?int $roleId, User $invitador): Invitation
    {
        $empresaId = $invitador->is_platform_admin
            ? throw ValidationException::withMessages(['email' => 'Un Platform Super Admin no puede invitar usuarios a una empresa.'])
            : $invitador->empresa_id;

        $this->invitaciones->invitacionesPendientesPara($email, $empresaId);

        $rawToken = Str::random(64);

        $invitacion = $this->invitaciones->crear([
            'email' => $email,
            'name' => $name,
            'empresa_id' => $empresaId,
            'role_id' => $roleId,
            'token_hash' => hash('sha256', $rawToken),
            'invited_by' => $invitador->id,
            'expires_at' => now()->addDays(self::DIAS_EXPIRACION),
        ]);

        Notification::route('mail', $email)->notify(
            new InvitationNotification($rawToken, $invitador->empresa->nombre, $name)
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
            // Esta ruta es pública (sin middleware 'empresa', ver
            // InvitationController) — no hay usuario autenticado del que
            // derivar la empresa. `empresa_id` sale de la propia
            // Invitation ya persistida y validada, nunca de un input del
            // visitante — el `where('empresa_id', ...)` explícito es la
            // única protección aquí (ADR-019: sin EmpresaContext).
            app(PermissionRegistrar::class)->setPermissionsTeamId($invitacion->empresa_id);
            $rol = Role::where('id', $invitacion->role_id)
                ->where('empresa_id', $invitacion->empresa_id)
                ->firstOrFail();
            $usuario->assignRole($rol);
        }

        $this->invitaciones->marcarAceptada($invitacion);

        return $usuario;
    }
}
