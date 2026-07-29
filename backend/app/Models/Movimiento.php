<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Movimiento extends Model
{
    use BelongsToEmpresa;

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
    ];

    protected function casts(): array
    {
        return [
            'cantidad' => 'decimal:2',
            'stock_anterior' => 'decimal:2',
            'stock_nuevo' => 'decimal:2',
            'costo' => 'decimal:2',
            'precio' => 'decimal:2',
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

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
