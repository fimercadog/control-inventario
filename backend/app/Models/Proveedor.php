<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Borrado lógico vía
 * `estado` (activo/inactivo) — misma convención que Producto/Categoria,
 * no Eloquent SoftDeletes.
 */
class Proveedor extends Model
{
    use BelongsToEmpresa;
    use HasFactory;

    // Eloquent pluraliza "Proveedor" como "proveedors" (regla inglesa) —
    // la tabla real es "proveedores" (migración create_proveedores_table).
    protected $table = 'proveedores';

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

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class);
    }

    /** FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). */
    public function productosAsociados(): HasMany
    {
        return $this->hasMany(ProductoProveedor::class);
    }
}
