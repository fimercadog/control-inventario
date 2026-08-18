<?php

namespace App\Http\Requests\Marca;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMarcaRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'max:255'],
            'estado' => ['sometimes', 'string', 'in:activo,inactivo'],
            'proveedor_ids' => ['sometimes', 'array'],
            'proveedor_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('proveedores', 'id')->where('empresa_id', $this->user()?->empresa_id),
            ],
        ];
    }
}
