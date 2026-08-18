<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EjecucionAutomatizacion extends Model
{
    use BelongsToEmpresa;
    public $timestamps = false;
    protected $table = 'ejecuciones_automatizacion';
    protected $fillable = ['empresa_id', 'automatizacion_id', 'evento', 'entidad_tipo', 'entidad_id', 'clave_idempotencia', 'estado', 'resultado', 'error', 'ejecutada_at'];
    protected function casts(): array { return ['resultado' => 'array', 'ejecutada_at' => 'datetime']; }
    public function automatizacion(): BelongsTo { return $this->belongsTo(Automatizacion::class); }
}
