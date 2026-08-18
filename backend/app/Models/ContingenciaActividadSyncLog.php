<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContingenciaActividadSyncLog extends Model
{
    use BelongsToEmpresa;

    protected $table = 'contingencia_actividades_sync_log';
    protected $fillable = ['empresa_id', 'usuario_id', 'operacion_id', 'actividad_id', 'procesado_at'];
    protected function casts(): array { return ['procesado_at' => 'datetime']; }
    public function actividad(): BelongsTo { return $this->belongsTo(Actividad::class); }
    public function usuario(): BelongsTo { return $this->belongsTo(User::class, 'usuario_id'); }
}
