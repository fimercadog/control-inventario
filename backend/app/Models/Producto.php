<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Producto extends Model
{
    use BelongsToEmpresa;
    use HasFactory;

    /**
     * stock_actual queda fuera de $fillable a propósito: solo InventoryService
     * puede modificarlo (ver docs/00_MASTER_SPECIFICATION.md sección 74,
     * "Propiedad exclusiva del stock"). `stock_estado` sí es fillable, pero
     * ningún FormRequest de Producto lo declara en sus reglas — solo
     * `StockController::disable()`/`enable()` (docs/03_FUNCTIONAL_SPEC/Stock.md)
     * lo escriben, nunca el formulario de catálogo del producto.
     */
    protected $fillable = [
        'empresa_id',
        'categoria_id',
        'codigo',
        'codigo_barras',
        'nombre',
        'marca_id',
        'descripcion',
        'presentacion',
        'costo',
        'precio',
        'unidad_medida_id',
        'stock_minimo',
        'stock_maximo',
        'imagen',
        'estado',
        'inhabilitado_por_stock',
        'stock_estado',
    ];

    protected function casts(): array
    {
        return [
            'costo' => 'decimal:2',
            'precio' => 'decimal:2',
            'stock_actual' => 'decimal:2',
            'stock_minimo' => 'decimal:2',
            'stock_maximo' => 'decimal:2',
            'inhabilitado_por_stock' => 'boolean',
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

    /** RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/Brands.md) — reemplaza el campo de texto libre `marca`. */
    public function marca(): BelongsTo
    {
        return $this->belongsTo(Marca::class);
    }

    /** RC1 Fase 1 (docs/03_FUNCTIONAL_SPEC/UnitsOfMeasure.md) — reemplaza el campo de texto libre `unidad_medida`. */
    public function unidadMedida(): BelongsTo
    {
        return $this->belongsTo(UnidadMedida::class, 'unidad_medida_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(Movimiento::class);
    }

    /** Punto 8 (docs/diagrama-bd.md) — saldo por bodega, base estructural aun sin cablear al camino de escritura. */
    public function bodegas(): BelongsToMany
    {
        return $this->belongsToMany(Bodega::class, 'producto_bodega')
            ->using(ProductoBodega::class)
            ->withPivot(['stock_actual'])
            ->withTimestamps();
    }

    /** FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md). */
    public function proveedoresAsociados(): HasMany
    {
        return $this->hasMany(ProductoProveedor::class);
    }

    /**
     * WO "Modelo de base de datos" (2026-08-17). Convenience añadida junto a
     * proveedoresAsociados() (no en su lugar): esta expone la lista plana de
     * Proveedor vía belongsToMany, para el código que solo necesita "qué
     * proveedores tiene este producto". Los atributos propios de la
     * asociación (es_principal/precio_compra/codigo_proveedor) siguen
     * disponibles vía ->pivot (clase Pivot genérica de Eloquent) — sin
     * ->using(ProductoProveedor::class) a propósito: ese modelo ya existe,
     * es Model plano (no Pivot) y lo usa ProductoProveedorController vía
     * ::create() directo, no vía attach(); cambiarle la clase base para que
     * ->using() funcione es un riesgo innecesario para código ya probado,
     * cuando esta relación solo necesita lectura.
     */
    public function proveedores(): BelongsToMany
    {
        return $this->belongsToMany(Proveedor::class, 'producto_proveedor')
            ->withPivot(['es_principal', 'precio_compra', 'codigo_proveedor', 'estado'])
            ->withTimestamps();
    }

    public function proveedorPrincipal(): ?ProductoProveedor
    {
        return $this->proveedoresAsociados()
            ->where('estado', 'activo')
            ->where('es_principal', true)
            ->with('proveedor')
            ->first();
    }
}
