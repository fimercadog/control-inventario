<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Fundacion estructural de multi-bodega (punto 8, docs/diagrama-bd.md).
 * Toda empresa migrada tiene una bodega "Principal" (es_principal=true)
 * creada por 2026_08_18_092000_create_bodegas_and_stock_por_bodega.php.
 * InventoryService actualiza tanto el saldo de esta bodega como el total
 * consolidado de productos.stock_actual.
 */
class Bodega extends Model
{
    use BelongsToEmpresa;
    use HasFactory;

    protected $fillable = [
        'empresa_id',
        'nombre',
        'es_principal',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'es_principal' => 'boolean',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function productoBodegas(): HasMany
    {
        return $this->hasMany(ProductoBodega::class);
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class);
    }
}
