<?php

namespace App\Models;

use App\Enums\Contingencia\TipoOperacionContingencia;
use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Ledger de idempotencia de Modo Contingencia — nunca una entidad de
 * negocio en sí misma. Ver docblock de la migración
 * `2026_08_16_220000_create_contingencia_sync_log_table.php`.
 */
class ContingenciaSyncLog extends Model
{
    use BelongsToEmpresa;

    protected $table = 'contingencia_sync_log';

    protected $fillable = [
        'empresa_id',
        'usuario_id',
        'operacion_id',
        'tipo',
        'producto_id',
        'procesado_at',
    ];

    protected function casts(): array
    {
        return [
            'tipo' => TipoOperacionContingencia::class,
            'procesado_at' => 'datetime',
        ];
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
