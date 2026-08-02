<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Módulo Clientes (2026-08-02, vertical slice completo). Borrado lógico
 * vía `estado` (activo/inactivo) — misma convención que Producto/
 * Categoria/Proveedor, no Eloquent SoftDeletes.
 */
class Cliente extends Model
{
    use BelongsToEmpresa;
    use HasFactory;

    protected $fillable = [
        'empresa_id',
        'nombre',
        'nit',
        'contacto',
        'telefono',
        'email',
        'direccion',
        'ciudad',
        'pais',
        'notas',
        'estado',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
}
