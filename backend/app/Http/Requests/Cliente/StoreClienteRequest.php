<?php

namespace App\Http\Requests\Cliente;

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
            // Único por empresa, no global — mismo criterio que `email`.
            // `nit` es Identity (ADR-015): esta regla solo aplica al crear,
            // nunca al editar (`UpdateClienteRequest` ni siquiera acepta el
            // campo) — cerrado el riesgo documentado en la auditoría de
            // campos editables del mismo día, ver Customers.md.
            'nit' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('clientes', 'nit')->where('empresa_id', $this->user()?->empresa_id),
            ],
            'contacto' => ['sometimes', 'nullable', 'string', 'max:255'],
            'telefono' => ['sometimes', 'nullable', 'string', 'max:255'],
            // Único por empresa, no global — dos clientes de EMPRESAS
            // distintas pueden compartir un email sin problema.
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('clientes', 'email')->where('empresa_id', $this->user()?->empresa_id),
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
            'nit.unique' => 'Ya existe un cliente con este NIT en tu empresa.',
        ];
    }
}
