<?php

namespace App\Http\Requests\Cliente;

use App\Services\Auth\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreClienteRequest extends FormRequest
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
            'nit' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contacto' => ['sometimes', 'nullable', 'string', 'max:255'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:255'],
            // Único por empresa, no global — dos clientes de EMPRESAS
            // distintas pueden compartir un email sin problema; `nit` no
            // lleva la misma regla a propósito (sigue siendo un campo de
            // referencia, ver Customers.md).
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('clientes', 'email')->where('empresa_id', app(TenantContext::class)->empresaId()),
            ],
            'direccion' => ['sometimes', 'nullable', 'string', 'max:255'],
            'ciudad' => ['sometimes', 'nullable', 'string', 'max:255'],
            'pais' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notas' => ['sometimes', 'nullable', 'string'],
            'estado' => ['sometimes', 'string', 'in:activo,inactivo'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'Ya existe un cliente con este correo en tu empresa.',
        ];
    }
}
