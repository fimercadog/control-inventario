<?php

namespace App\Http\Requests\Producto;

use Illuminate\Foundation\Http\FormRequest;

/**
 * `stock_actual` deliberadamente ausente de las reglas: nunca es aceptado
 * en este payload, ni siquiera para ignorarlo silenciosamente — es
 * propiedad exclusiva de InventoryService (docs/03_FUNCTIONAL_SPEC/Products.md,
 * adenda "Ficha de Producto").
 */
class UpdateProductoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'stock_actual' => ['prohibited'],
            'nombre' => ['sometimes', 'string', 'max:255'],
            'marca_id' => ['sometimes', 'nullable', 'integer', 'exists:marcas,id'],
            'marca_nuevo' => ['sometimes', 'nullable', 'string', 'max:255'],
            'descripcion' => ['sometimes', 'nullable', 'string'],
            'presentacion' => ['sometimes', 'nullable', 'string', 'max:255'],
            'categoria_id' => ['sometimes', 'nullable', 'integer', 'exists:categorias,id'],
            'costo' => ['sometimes', 'numeric', 'min:0'],
            'precio' => ['sometimes', 'numeric', 'min:0'],
            'unidad_medida_id' => ['sometimes', 'nullable', 'integer', 'exists:unidades_medida,id'],
            'unidad_medida_nuevo' => ['sometimes', 'nullable', 'string', 'max:255'],
            'stock_minimo' => ['sometimes', 'numeric', 'min:0'],
            'stock_maximo' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'estado' => ['sometimes', 'string', 'in:activo,inactivo'],
        ];
    }
}
