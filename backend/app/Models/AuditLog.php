<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;
use LogicException;

/**
 * Registro de auditoría, inmutable por diseño (sección 61 del master
 * spec: "Nunca podrá modificarse. Nunca podrá eliminarse."). No es
 * exclusivo de Captura IA: `modulo`/`accion` lo hacen reutilizable por
 * cualquier módulo futuro que necesite dejar rastro de una acción.
 */
class AuditLog extends Model
{
    use BelongsToEmpresa;
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'uuid',
        'empresa_id',
        'usuario_id',
        'modulo',
        'accion',
        'auditable_type',
        'auditable_id',
        'valores_anteriores',
        'valores_nuevos',
        'resultado',
        'ip',
        'user_agent',
        'created_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $log) {
            $log->uuid ??= (string) Str::uuid();
            $log->created_at ??= now();
        });
    }

    protected function casts(): array
    {
        return [
            'valores_anteriores' => 'array',
            'valores_nuevos' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    public function update(array $attributes = [], array $options = []): bool
    {
        throw new LogicException('AuditLog es inmutable: no puede actualizarse (sección 61 del master spec).');
    }

    public function delete(): bool
    {
        throw new LogicException('AuditLog es inmutable: no puede eliminarse (sección 61 del master spec).');
    }
}
