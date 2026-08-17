<?php

namespace App\Http\Requests\Contingencia;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Modo Contingencia (docs/03_FUNCTIONAL_SPEC/ProductContingencyMode.md).
 * Valida únicamente el "sobre" de la operación — `payload` (los campos
 * reales del producto) se valida aparte, en el Controller, reusando
 * `StoreProductoRequest::rules()`/`UpdateProductoRequest::rules()` tal
 * cual (nunca una copia — Ponytail, sección 14 del Work Order).
 */
class SincronizarOperacionRequest extends FormRequest
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
            // Generado en el cliente al crear la operación offline — también
            // es lo que viaja en el header Idempotency-Key.
            'operacion_id' => ['required', 'uuid'],
            'tipo' => ['required', 'string', Rule::in(['crear', 'actualizar'])],
            'producto_id' => ['required_if:tipo,actualizar', 'prohibited_if:tipo,crear', 'integer'],
            // Timestamp ISO8601 de `producto.updated_at` capturado por el
            // cliente cuando creó la operación offline — sección 11 del
            // Work Order, detección de conflicto.
            'base_version' => ['required_if:tipo,actualizar', 'prohibited_if:tipo,crear', 'string'],
            'payload' => ['required', 'array'],
        ];
    }
}
