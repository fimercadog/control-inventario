<?php

namespace App\Models;

use App\Enums\CapturaIA\EstadoCapturaDetalle;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CapturaIADetalle extends Model
{
    protected $table = 'capturas_ia_detalle';

    protected $fillable = [
        'captura_id',
        'producto_id',
        'movimiento_id',
        'nombre_detectado',
        'marca_detectado',
        'categoria_detectado',
        'presentacion_detectado',
        'unidad_detectado',
        'cantidad_detectada',
        'confianza',
        'es_producto_nuevo',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'estado' => EstadoCapturaDetalle::class,
            'cantidad_detectada' => 'decimal:2',
            'confianza' => 'decimal:3',
            'es_producto_nuevo' => 'boolean',
        ];
    }

    public function captura(): BelongsTo
    {
        return $this->belongsTo(CapturaIA::class, 'captura_id');
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    public function movimiento(): BelongsTo
    {
        return $this->belongsTo(Movimiento::class);
    }
}
