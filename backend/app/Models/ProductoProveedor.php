<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). Asociación
 * Producto↔Proveedor con atributos propios — nunca un pivot silencioso.
 * Borrado lógico vía `estado`, misma convención del resto del proyecto.
 */
class ProductoProveedor extends Model
{
    use BelongsToEmpresa;
    use HasFactory;

    protected $table = 'producto_proveedor';

    protected $fillable = [
        'empresa_id',
        'producto_id',
        'proveedor_id',
        'es_principal',
        'precio_compra',
        'codigo_proveedor',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'es_principal' => 'boolean',
            'precio_compra' => 'decimal:2',
        ];
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
    }
}
