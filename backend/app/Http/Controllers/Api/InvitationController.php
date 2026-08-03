<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Invitation\AcceptInvitationRequest;
use App\Http\Requests\Invitation\StoreInvitationRequest;
use App\Http\Support\ApiResponse;
use App\Models\Invitation;
use App\Services\Audit\AuditLogger;
use App\Services\InvitationService;
use Illuminate\Http\JsonResponse;

/**
 * Módulo 6 — Invitaciones (2026-08-03, docs/03_FUNCTIONAL_SPEC/Users.md).
 * `store()` requiere sesión + `usuarios.invitar` (`InvitationPolicy`);
 * `show()`/`aceptar()` son deliberadamente públicas — quien las llama
 * todavía no tiene cuenta, la posesión del token es la única prueba de
 * identidad en ese punto (mismo principio que "restablecer contraseña").
 */
class InvitationController extends Controller
{
    public function __construct(
        private readonly InvitationService $invitaciones,
        private readonly AuditLogger $auditoria,
    ) {}

    public function store(StoreInvitationRequest $request): JsonResponse
    {
        $this->authorize('create', Invitation::class);

        $datos = $request->validated();
        $invitacion = $this->invitaciones->crear($datos['email'], $datos['role_id'] ?? null, $request->user());

        $this->auditoria->registrarAccionManual(
            empresaId: $invitacion->empresa_id,
            usuarioId: $request->user()->id,
            modulo: 'usuarios',
            accion: 'usuarios.invitar',
            auditableType: Invitation::class,
            auditableId: $invitacion->id,
            valoresNuevos: ['email' => $invitacion->email, 'role_id' => $invitacion->role_id],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(null, 'Invitación enviada correctamente', 201);
    }

    public function show(string $token): JsonResponse
    {
        $invitacion = $this->invitaciones->resolverPorToken($token)->load(['empresa:id,nombre', 'role:id,name']);

        return ApiResponse::success([
            'email' => $invitacion->email,
            'empresa' => $invitacion->empresa->nombre,
            'rol' => $invitacion->role?->name,
        ]);
    }

    public function aceptar(AcceptInvitationRequest $request, string $token): JsonResponse
    {
        $invitacion = $this->invitaciones->resolverPorToken($token);
        $datos = $request->validated();

        $usuario = $this->invitaciones->aceptar($invitacion, $datos['name'], $datos['password']);

        $this->auditoria->registrarAccionManual(
            empresaId: $usuario->empresa_id,
            usuarioId: $usuario->id,
            modulo: 'usuarios',
            accion: 'usuarios.aceptar_invitacion',
            auditableType: Invitation::class,
            auditableId: $invitacion->id,
            valoresNuevos: ['user_id' => $usuario->id],
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return ApiResponse::success(null, 'Cuenta creada correctamente. Ya puedes iniciar sesión.', 201);
    }
}
