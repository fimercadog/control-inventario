<?php

namespace App\Http\Requests\Stock;

use Illuminate\Foundation\Http\FormRequest;

/**
 * RC1 Fase 2 (docs/03_FUNCTIONAL_SPEC/Stock.md). Deliberadamente NO
 * declara `stock_actual` ni `estado`/`stock_estado` — este formulario
 * solo puede tocar los umbrales de alerta. `stock_actual` sigue siendo
 * propiedad exclusiva de `InventoryService::registrarMovimiento()`; el
 * estado administrativo del registro de Stock se cambia únicamente vía
 * `StockController::disable()`/`enable()`, nunca aquí.
 */
class UpdateStockRequest extends FormRequest
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
            'stock_minimo' => ['sometimes', 'numeric', 'min:0'],
            'stock_maximo' => ['sometimes', 'nullable', 'numeric', 'min:0'],
        ];
    }
}
