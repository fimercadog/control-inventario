<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use LogicException;

/**
 * Historial de ejecución de reportes (2026-08-03) — inmutable, mismo
 * espíritu que `AuditLog`: "qué reportes se consultaron y cuándo", nunca
 * "qué acción de negocio ocurrió" (eso lo sigue cubriendo `AuditLog`,
 * sin duplicación).
 */
class ReporteHistorial extends Model
{
    use BelongsToEmpresa;

    public $timestamps = false;

    protected $table = 'reporte_historial';

    protected $fillable = [
        'uuid',
        'empresa_id',
        'usuario_id',
        'tipo_reporte',
        'formato',
        'filtros',
        'total_filas',
        'created_at',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $registro) {
            $registro->uuid ??= (string) Str::uuid();
            $registro->created_at ??= now();
        });
    }

    protected function casts(): array
    {
        return [
            'filtros' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function update(array $attributes = [], array $options = []): bool
    {
        throw new LogicException('ReporteHistorial es inmutable: no puede actualizarse.');
    }

    public function delete(): bool
    {
        throw new LogicException('ReporteHistorial es inmutable: no puede eliminarse.');
    }
}
