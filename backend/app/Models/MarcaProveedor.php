<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * WO "Modelo de base de datos" (2026-08-17). Asociación Marca↔Proveedor.
 * Sin atributos propios hoy (a diferencia de ProductoProveedor), pero
 * modelada como entidad propia — no un belongsToMany plano — para que
 * BelongsToEmpresa siga siendo lo único responsable de fijar empresa_id
 * al crear, mismo criterio que el resto de las asociaciones de este
 * backend (ADR-019).
 *
 * Extiende Pivot (no Model): Marca::proveedores()/Proveedor::marcas() usan
 * ->using(self::class), y BelongsToMany necesita que la clase del pivot
 * provea fromRawAttributes() (propio de Pivot) para poder hidratar filas al
 * hacer attach()/sync() — con Model plano eso falla con
 * "Call to undefined method fromRawAttributes()". `marca_proveedor` tiene
 * su propia PK autoincremental (id), así que $incrementing se reactiva
 * explícitamente (Pivot lo pone en false por defecto, pensado para pivots
 * sin PK propia).
 */
class MarcaProveedor extends Pivot
{
    use BelongsToEmpresa;
    use HasFactory;

    public $incrementing = true;

    protected $table = 'marca_proveedor';

    protected $fillable = [
        'empresa_id',
        'marca_id',
        'proveedor_id',
    ];

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class);
    }

    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class);
    }
}
