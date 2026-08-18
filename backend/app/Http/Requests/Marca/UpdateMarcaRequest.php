<?php

namespace App\Http\Requests\Marca;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * `estado` (Controlled) removido de las reglas 2026-08-10 (auditoría de
 * RBAC): `MarcaPolicy::update()` solo exige `marcas.editar`, un permiso
 * más laxo que `marcas.gestionar` (el que exige `/deshabilitar`). Mismo
 * hallazgo y mismo fix ya aplicados en Categorías/Productos el mismo día.
 * `marca-form-modal.tsx` nunca envía este campo.
 */
class UpdateMarcaRequest extends FormRequest
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
            'proveedor_ids' => ['sometimes', 'array'],
            'proveedor_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('proveedores', 'id')->where('empresa_id', $this->user()?->empresa_id),
            ],
        ];
    }
}
