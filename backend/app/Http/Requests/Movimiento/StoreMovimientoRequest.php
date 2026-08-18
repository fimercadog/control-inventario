<?php

namespace App\Http\Requests\Movimiento;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Crear un movimiento
 * real desde el módulo global (Entrada/Salida/Ajuste) — distinto de
 * `StoreIngresoRequest`, que sigue siendo el flujo de "Registrar Ingreso"
 * desde la Ficha de Producto (sin cambios). `direccion` solo aplica a
 * Ajuste (el único tipo bidireccional): un conteo físico puede encontrar
 * más o menos stock del esperado. Entrada/Salida ignoran `direccion` —
 * su dirección la sigue decidiendo `InventoryService` según `tipo`.
 */
class StoreMovimientoRequest extends FormRequest
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
            'producto_id' => ['required', 'integer', 'exists:productos,id'],
            'bodega_id' => ['sometimes', 'nullable', 'integer', 'exists:bodegas,id'],
            'tipo' => ['required', 'string', Rule::in(['entrada', 'salida', 'ajuste'])],
            'cantidad' => ['required', 'numeric', 'min:0.01'],
            'direccion' => ['required_if:tipo,ajuste', 'prohibited_unless:tipo,ajuste', 'string', Rule::in(['incremento', 'decremento'])],
            'costo' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'precio' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'proveedor_id' => ['sometimes', 'nullable', 'integer', 'exists:proveedores,id', 'prohibited_unless:tipo,entrada'],
            'documento' => ['sometimes', 'nullable', 'string', 'max:255'],
            'observacion' => ['required_if:tipo,ajuste', 'nullable', 'string', 'min:3', 'max:255'],
            'lote' => ['sometimes', 'nullable', 'string', 'max:255'],
            'vencimiento' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
