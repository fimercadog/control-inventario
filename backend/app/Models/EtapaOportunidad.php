<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EtapaOportunidad extends Model
{
    use BelongsToEmpresa;

    protected $table = 'etapas_oportunidad';
    protected $fillable = ['empresa_id', 'nombre', 'orden', 'probabilidad', 'tipo', 'estado'];
    protected function casts(): array { return ['estado' => 'boolean']; }
    public function empresa(): BelongsTo { return $this->belongsTo(Empresa::class); }
    public function oportunidades(): HasMany { return $this->hasMany(Oportunidad::class); }
}
