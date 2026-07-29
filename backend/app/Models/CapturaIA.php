<?php

namespace App\Models;

use App\Enums\CapturaIA\EstadoCaptura;
use App\Enums\CapturaIA\TipoCaptura;
use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Str;

class CapturaIA extends Model
{
    use BelongsToEmpresa;

    protected $table = 'capturas_ia';

    protected $fillable = [
        'uuid',
        'empresa_id',
        'usuario_id',
        'idempotency_key',
        'tipo',
        'archivo_path',
        'archivo_secundario_path',
        'archivo_mime',
        'transcripcion',
        'respuesta_ia_json',
        'proveedor_ia',
        'tiempo_procesamiento_ms',
        'movimiento_tipo',
        'confianza_promedio',
        'estado',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $captura) {
            // UUID estable para apps móviles e integraciones externas; el id
            // numérico autoincremental nunca se expone fuera del backend
            // (sección 74 del master spec, punto 6).
            $captura->uuid ??= (string) Str::uuid();
        });
    }

    protected function casts(): array
    {
        return [
            'tipo' => TipoCaptura::class,
            'estado' => EstadoCaptura::class,
            'respuesta_ia_json' => 'array',
            'confianza_promedio' => 'decimal:3',
            'tiempo_procesamiento_ms' => 'integer',
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

    public function detalles(): HasMany
    {
        return $this->hasMany(CapturaIADetalle::class, 'captura_id');
    }

    public function auditLogs(): MorphMany
    {
        return $this->morphMany(AuditLog::class, 'auditable');
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }
}
