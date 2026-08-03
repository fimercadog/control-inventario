<?php

namespace App\Http\Requests\Cliente;

use App\Services\Auth\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateClienteRequest extends FormRequest
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
            // `ignore($this->route('cliente'))` — editar un cliente sin
            // tocar su propio email (o dejándolo igual) nunca debe contar
            // como conflicto consigo mismo, mismo fix que StoreRoleRequest.
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('clientes', 'email')
                    ->where('empresa_id', app(TenantContext::class)->empresaId())
                    ->ignore($this->route('cliente')),
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
