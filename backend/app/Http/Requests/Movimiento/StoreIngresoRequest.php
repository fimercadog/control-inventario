<?php

namespace App\Http\Requests\Movimiento;

use Illuminate\Foundation\Http\FormRequest;

/**
 * FEATURE-002 (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2). "Factura"
 * se recibe como `documento` — mismo campo que ya usa Captura IA, no uno
 * nuevo. `lote`/`vencimiento` son descriptivos (ver la adenda): no
 * implementan inventario por lote real.
 *
 * FEATURE-003 (docs/03_FUNCTIONAL_SPEC/Suppliers.md): `proveedor_id`
 * selecciona un proveedor ya existente; `proveedor_nuevo` crea uno al
 * vuelo (Suppliers module, "Select existing supplier or Create supplier
 * quickly"). Son mutuamente excluyentes — nunca ambos a la vez.
 */
class StoreIngresoRequest extends FormRequest
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
            'cantidad' => ['required', 'numeric', 'min:0.01'],
            'costo' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'proveedor_id' => ['sometimes', 'nullable', 'integer', 'exists:proveedores,id'],
            'proveedor_nuevo' => ['sometimes', 'nullable', 'string', 'max:255'],
            'documento' => ['sometimes', 'nullable', 'string', 'max:255'],
            'observacion' => ['sometimes', 'nullable', 'string', 'max:255'],
            'lote' => ['sometimes', 'nullable', 'string', 'max:255'],
            'vencimiento' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
