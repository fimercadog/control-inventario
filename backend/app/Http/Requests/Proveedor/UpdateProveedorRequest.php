<?php

namespace App\Http\Requests\Proveedor;

use Illuminate\Foundation\Http\FormRequest;

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
            'nombre' => ['sometimes', 'string', 'max:255'],
            'nit' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contacto' => ['sometimes', 'nullable', 'string', 'max:255'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'direccion' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ciudad' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pais' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notas' => ['sometimes', 'nullable', 'string'],
            'estado' => ['sometimes', 'string', 'in:activo,inactivo'],
        ];
    }
}
