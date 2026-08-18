<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificacionCrm extends Model
{
    use BelongsToEmpresa;
    protected $table = 'notificaciones_crm';
    protected $fillable = ['empresa_id', 'usuario_id', 'tipo', 'titulo', 'mensaje', 'datos', 'leida_at'];
    protected function casts(): array { return ['datos' => 'array', 'leida_at' => 'datetime']; }
    public function empresa(): BelongsTo { return $this->belongsTo(Empresa::class); }
    public function usuario(): BelongsTo { return $this->belongsTo(User::class, 'usuario_id'); }
}
