<?php

namespace App\Repositories;

use App\Models\Invitation;

/**
 * Módulo 6 — Invitaciones (2026-08-03). Sin `EmpresaScope` en `Invitation`
 * (ver docblock del modelo) — este Repository SÍ filtra `empresa_id` a
 * mano en `crear()`/`invitacionesPendientesPara()` (llamado desde un
 * contexto autenticado), pero `porTokenHash()` deliberadamente no filtra
 * por empresa: la resuelve un visitante sin sesión, la posesión del
 * token es la única prueba de identidad en ese punto.
 */
class InvitationRepository
{
    public function crear(array $datos): Invitation
    {
        return Invitation::create($datos);
    }

    public function porTokenHash(string $tokenHash): ?Invitation
    {
        return Invitation::where('token_hash', $tokenHash)->first();
    }

    /**
     * Invitaciones no aceptadas para el mismo email dentro de la misma
     * empresa — re-invitar a alguien reemplaza cualquier invitación
     * pendiente anterior en vez de acumular tokens válidos duplicados.
     */
    public function invitacionesPendientesPara(string $email, int $empresaId): void
    {
        Invitation::where('email', $email)
            ->where('empresa_id', $empresaId)
            ->whereNull('accepted_at')
            ->delete();
    }

    public function marcarAceptada(Invitation $invitacion): void
    {
        $invitacion->update(['accepted_at' => now()]);
    }
}
