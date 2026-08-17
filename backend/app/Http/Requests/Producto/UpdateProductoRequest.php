<?php

namespace App\Http\Requests\Producto;

use Illuminate\Foundation\Http\FormRequest;

/**
 * `stock_actual` deliberadamente ausente de las reglas: nunca es aceptado
 * en este payload, ni siquiera para ignorarlo silenciosamente — es
 * propiedad exclusiva de InventoryService (docs/03_FUNCTIONAL_SPEC/Products.md,
 * adenda "Ficha de Producto").
 *
 * `estado` (Controlled) removido 2026-08-10 (auditoría de RBAC): `ProductoPolicy::update()`
 * solo exige `productos.editar`, un permiso más laxo que `productos.gestionar`
 * (el que exige `/deshabilitar`) — un `estado` aceptado aquí habría permitido
 * deshabilitar/habilitar un producto con el permiso más laxo, saltándose la
 * verificación más estricta. Mismo hallazgo y mismo fix ya aplicado en
 * Categorías/Proveedores/Movimientos. `producto-form-modal.tsx` nunca envía
 * este campo, así que el fix no afecta ningún flujo real.
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
        ];
    }
}
