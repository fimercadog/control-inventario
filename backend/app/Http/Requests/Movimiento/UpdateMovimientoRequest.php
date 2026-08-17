<?php

namespace App\Http\Requests\Movimiento;

use Illuminate\Foundation\Http\FormRequest;

/**
 * RC1 Fase 3 (docs/03_FUNCTIONAL_SPEC/Movements.md). Decisión confirmada
 * explícitamente por el propietario del proyecto: un movimiento es
 * inmutable en lo financiero/estructural una vez creado. Deliberadamente
 * NO declara `cantidad`, `tipo`, `producto_id`, `proveedor_id`,
 * `stock_anterior` ni `stock_nuevo` — ningún payload puede tocarlos,
 * sin importar lo que el cliente envíe (`$request->validated()` los
 * excluye siempre). Solo metadata descriptiva es editable, para corregir
 * un error de tipeo sin alterar el registro contable del movimiento.
 */
class UpdateMovimientoRequest extends FormRequest
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
            'documento' => ['sometimes', 'nullable', 'string', 'max:255'],
            'observacion' => ['sometimes', 'nullable', 'string', 'max:255'],
            'lote' => ['sometimes', 'nullable', 'string', 'max:255'],
            'vencimiento' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
