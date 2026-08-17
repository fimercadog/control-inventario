<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Brands.md). Catálogo administrable —
 * reemplaza el campo de texto libre `productos.marca`. Borrado lógico vía
 * `estado`, misma convención del resto del proyecto.
 */
class Marca extends Model
{
    use BelongsToEmpresa;
    use HasFactory;

    protected $fillable = [
        'empresa_id',
        'nombre',
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

    /** WO "Modelo de base de datos" (2026-08-17). Marca↔Proveedor, tabla nueva marca_proveedor. */
    public function proveedores(): BelongsToMany
    {
        return $this->belongsToMany(Proveedor::class, 'marca_proveedor')
            ->using(MarcaProveedor::class)
            ->withTimestamps();
    }
}
