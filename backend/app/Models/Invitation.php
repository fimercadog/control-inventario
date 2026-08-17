<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Módulo 6 — Invitaciones (2026-08-03). Sin `BelongsToEmpresa` a
 * propósito, mismo motivo que `User`: la aceptación (`GET`/`POST
 * /invitaciones/{token}`) la resuelve un visitante SIN sesión ni
 * `EmpresaContext` — un `EmpresaScope` global dejaría esa consulta
 * fail-closed siempre. El único punto de entrada autenticado
 * (`InvitationController::store`) filtra `empresa_id` a mano, igual que
 * `UserController` ya hace con `User`.
 */
class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'empresa_id',
        'role_id',
        'token_hash',
        'invited_by',
        'expires_at',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function estaExpirada(): bool
    {
        return $this->expires_at->isPast();
    }

    public function estaAceptada(): bool
    {
        return $this->accepted_at !== null;
    }
}
