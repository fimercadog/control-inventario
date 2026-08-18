<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Oportunidad extends Model
{
    use BelongsToEmpresa;
    protected $table = 'oportunidades';
    protected $fillable = ['empresa_id', 'cliente_id', 'contacto_id', 'etapa_oportunidad_id', 'responsable_id', 'nombre', 'monto', 'probabilidad', 'fecha_cierre_estimada', 'ganada_at', 'perdida_at', 'razon_perdida', 'descripcion'];
    protected function casts(): array { return ['monto' => 'decimal:2', 'fecha_cierre_estimada' => 'date', 'ganada_at' => 'datetime', 'perdida_at' => 'datetime']; }
    public function empresa(): BelongsTo { return $this->belongsTo(Empresa::class); }
    public function cliente(): BelongsTo { return $this->belongsTo(Cliente::class); }
    public function contacto(): BelongsTo { return $this->belongsTo(Contacto::class); }
    public function etapa(): BelongsTo { return $this->belongsTo(EtapaOportunidad::class, 'etapa_oportunidad_id'); }
    public function responsable(): BelongsTo { return $this->belongsTo(User::class, 'responsable_id'); }
    public function actividades(): HasMany { return $this->hasMany(Actividad::class); }
}
