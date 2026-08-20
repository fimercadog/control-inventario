<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CapturaCrmIA extends Model
{
    use BelongsToEmpresa;

    protected $table = 'capturas_crm_ia';
    protected $fillable = ['uuid', 'empresa_id', 'usuario_id', 'entidad', 'contenido_original', 'propuesta_ia', 'proveedor_ia', 'confianza', 'estado', 'entidad_creada_tipo', 'entidad_creada_id'];
    protected function casts(): array { return ['propuesta_ia' => 'array', 'confianza' => 'decimal:3']; }
    protected static function booted(): void { static::creating(fn (self $captura) => $captura->uuid ??= (string) Str::uuid()); }
}
