<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Registro server-side del refresh token opaco (docs/04_ARCHITECTURE.md,
 * "Flujo de tokens"). El JWT de acceso es stateless y no puede revocarse
 * individualmente; esta tabla es lo que hace posible "Active Sessions" y
 * la revocación por dispositivo. Nunca se guarda el token en claro, solo
 * su hash.
 */
class AuthSession extends Model
{
    protected $fillable = [
        'user_id',
        'refresh_token_hash',
        'device_name',
        'ip_address',
        'remember_me',
        'last_used_at',
        'expires_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'remember_me' => 'boolean',
            'last_used_at' => 'datetime',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null && $this->expires_at->isFuture();
    }
}
