<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md). Catálogo
 * administrable — reemplaza el campo de texto libre `productos.unidad_medida`.
 * Borrado lógico vía `estado`, misma convención del resto del proyecto.
 */
class UnidadMedida extends Model
{
    use BelongsToEmpresa;

    protected $table = 'unidades_medida';

    protected $fillable = [
        'empresa_id',
        'nombre',
        'abreviatura',
        'estado',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class);
    }
}
