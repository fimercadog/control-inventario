<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Actividad extends Model
{
    use BelongsToEmpresa;
    protected $table = 'actividades';
    protected $fillable = ['empresa_id', 'cliente_id', 'contacto_id', 'oportunidad_id', 'responsable_id', 'creado_por_id', 'tipo', 'asunto', 'descripcion', 'estado', 'programada_para', 'completada_at'];
    protected function casts(): array { return ['programada_para' => 'datetime', 'completada_at' => 'datetime']; }
    public function empresa(): BelongsTo { return $this->belongsTo(Empresa::class); }
    public function cliente(): BelongsTo { return $this->belongsTo(Cliente::class); }
    public function contacto(): BelongsTo { return $this->belongsTo(Contacto::class); }
    public function oportunidad(): BelongsTo { return $this->belongsTo(Oportunidad::class); }
    public function responsable(): BelongsTo { return $this->belongsTo(User::class, 'responsable_id'); }
    public function creadoPor(): BelongsTo { return $this->belongsTo(User::class, 'creado_por_id'); }
}
