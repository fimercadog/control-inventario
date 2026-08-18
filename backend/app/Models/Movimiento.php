<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Movimiento extends Model
{
    use BelongsToEmpresa;

    /**
     * cantidad/tipo/stock_anterior/stock_nuevo quedan fuera de lo editable
     * por diseño (ver UpdateMovimientoRequest/MovimientoController::update):
     * el ledger es inmutable, solo se corrige metadata descriptiva.
     */
    protected $fillable = [
        'empresa_id',
        'producto_id',
        'usuario_id',
        'tipo',
        'documento',
        'cantidad',
        'stock_anterior',
        'stock_nuevo',
        'costo',
        'precio',
        'observacion',
        'proveedor',
        'proveedor_id',
        'lote',
        'vencimiento',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'decimal:2',
            'stock_anterior' => 'decimal:2',
            'stock_nuevo' => 'decimal:2',
            'costo' => 'decimal:2',
            'precio' => 'decimal:2',
            'vencimiento' => 'date',
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

    /** Punto 8 (docs/diagrama-bd.md). Backfill a la bodega "Principal" en movimientos existentes; InventoryService aun no la escribe en movimientos nuevos. */
    public function bodega(): BelongsTo
    {
        return $this->belongsTo(Bodega::class);
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }

    public function proveedorRelacionado(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    /**
     * Reverso de `CapturaIADetalle::movimiento()` (2026-08-03, ampliación
     * de UX de Movimientos) — inverso a propósito: `capturas_ia_detalle`
     * tiene la FK (`movimiento_id`), `movimientos` nunca la tuvo. Solo
     * existe cuando este movimiento se originó en Captura IA; `null` para
     * cualquier movimiento manual. Usado exclusivamente para presentación
     * (origen + disponibilidad de evidencia), nunca para lógica de negocio.
     */
    public function capturaDetalle(): HasOne
    {
        return $this->hasOne(CapturaIADetalle::class, 'movimiento_id');
    }
}
