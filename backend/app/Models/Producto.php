<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    use BelongsToEmpresa;

    /**
     * stock_actual queda fuera de $fillable a propósito: solo InventoryService
     * puede modificarlo (ver docs/00_MASTER_SPECIFICATION.md sección 74,
     * "Propiedad exclusiva del stock").
     */
    protected $fillable = [
        'empresa_id',
        'categoria_id',
        'codigo',
        'codigo_barras',
        'nombre',
        'marca',
        'descripcion',
        'presentacion',
        'costo',
        'precio',
        'unidad_medida',
        'stock_minimo',
        'stock_maximo',
        'imagen',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'costo' => 'decimal:2',
            'precio' => 'decimal:2',
            'stock_actual' => 'decimal:2',
            'stock_minimo' => 'decimal:2',
            'stock_maximo' => 'decimal:2',
        ];
    }

    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class);
    }
}
