<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Intentos de login, éxito o fallo (docs/05_DATABASE.md, "security_logs").
 * A diferencia de audit_logs (acciones de un usuario ya autenticado), aquí
 * se registran también los intentos fallidos de actores anónimos. De solo
 * inserción: nunca se actualiza ni se borra.
 */
class SecurityLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'email',
        'user_id',
        'ip_address',
        'user_agent',
        'success',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'success' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
