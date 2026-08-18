<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contacto extends Model
{
    use BelongsToEmpresa;
    protected $fillable = ['empresa_id', 'cliente_id', 'responsable_id', 'nombre', 'apellido', 'email', 'telefono', 'cargo', 'origen', 'estado', 'notas', 'convertido_at'];
    protected function casts(): array { return ['convertido_at' => 'datetime']; }
    public function empresa(): BelongsTo { return $this->belongsTo(Empresa::class); }
    public function cliente(): BelongsTo { return $this->belongsTo(Cliente::class); }
    public function responsable(): BelongsTo { return $this->belongsTo(User::class, 'responsable_id'); }
    public function oportunidades(): HasMany { return $this->hasMany(Oportunidad::class); }
}
