<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Automatizacion extends Model
{
    use BelongsToEmpresa;
    protected $table = 'automatizaciones';
    protected $fillable = ['empresa_id', 'nombre', 'evento', 'filtros', 'acciones', 'activa'];
    protected function casts(): array { return ['filtros' => 'array', 'acciones' => 'array', 'activa' => 'boolean']; }
    public function empresa(): BelongsTo { return $this->belongsTo(Empresa::class); }
    public function ejecuciones(): HasMany { return $this->hasMany(EjecucionAutomatizacion::class); }
}
