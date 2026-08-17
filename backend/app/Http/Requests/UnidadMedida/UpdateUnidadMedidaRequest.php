<?php

namespace App\Http\Requests\UnidadMedida;

use Illuminate\Foundation\Http\FormRequest;

/**
 * `estado` (Controlled) removido de las reglas 2026-08-10 (auditoría de
 * RBAC): `UnidadMedidaPolicy::update()` solo exige `unidades-medida.editar`,
 * más laxo que `unidades-medida.gestionar` (el que exige `/deshabilitar`).
 * Mismo hallazgo y mismo fix ya aplicados en Categorías/Productos/Marcas
 * el mismo día. `unidad-medida-form-modal.tsx` nunca envía este campo.
 */
class UpdateUnidadMedidaRequest extends FormRequest
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
            'nombre' => ['sometimes', 'string', 'max:255'],
            'abreviatura' => ['sometimes', 'nullable', 'string', 'max:50'],
        ];
    }
}
