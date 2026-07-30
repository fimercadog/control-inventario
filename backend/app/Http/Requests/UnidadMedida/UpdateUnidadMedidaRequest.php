<?php

namespace App\Http\Requests\UnidadMedida;

use Illuminate\Foundation\Http\FormRequest;

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
            'estado' => ['sometimes', 'string', 'in:activo,inactivo'],
        ];
    }
}
