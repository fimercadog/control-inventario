<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * Saldo de un Producto en una Bodega especifica (punto 8,
 * docs/diagrama-bd.md). Extiende Pivot con PK propia, mismo criterio que
 * MarcaProveedor/ProductoProveedor (ADR-019) — no un belongsToMany plano,
 * para que BelongsToEmpresa siga fijando empresa_id.
 *
 * Poblado por backfill al crearse (una fila por producto contra la
 * bodega "Principal" de su empresa, copiando productos.stock_actual) y
 * actualizado por InventoryService en cada movimiento posterior.
 */
class ProductoBodega extends Pivot
{
    use BelongsToEmpresa;
    use HasFactory;

    public $incrementing = true;

    protected $table = 'producto_bodega';

    protected $fillable = [
        'empresa_id',
        'producto_id',
        'bodega_id',
        'stock_actual',
    ];

    protected function casts(): array
    {
        return [
            'stock_actual' => 'decimal:2',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function bodega(): BelongsTo
    {
        return $this->belongsTo(Bodega::class);
    }
}
