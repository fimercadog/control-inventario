<?php

namespace App\Http\Requests\Proveedor;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Modelo de identidad ERP (ADR-015, auditoría de campos editables
 * 2026-08-04). `email`/`nit` son campos de identidad — inmutables después
 * de la creación, igual que `empresa_id`/`id`. Se fijan únicamente en
 * `StoreProveedorRequest`; si se envían aquí, se ignoran en silencio (mismo
 * patrón estructural que `empresa_id`, que nunca estuvo en esta lista).
 */
class UpdateProveedorRequest extends FormRequest
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
            // `filled` (no solo `string`): un PATCH que envía `nombre` no
            // puede vaciarlo — campo operativo, pero nunca vacío
            // (auditoría de campos editables, 2026-08-04).
            'nombre' => ['sometimes', 'filled', 'string', 'max:255'],
            'contacto' => ['sometimes', 'nullable', 'string', 'max:255'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:255'],
            'direccion' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ciudad' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pais' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notas' => ['sometimes', 'nullable', 'string'],
            // `email`/`nit` (identidad, ADR-015) y `estado` (controlado —
            // solo vía /habilitar y /deshabilitar) deliberadamente fuera de
            // esta lista.
        ];
    }
}
