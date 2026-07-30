<?php

namespace App\Http\Requests\ProductoProveedor;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductoProveedorRequest extends FormRequest
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
            'proveedor_id' => ['required', 'integer', 'exists:proveedores,id'],
            'es_principal' => ['sometimes', 'boolean'],
            'precio_compra' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'codigo_proveedor' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
