<?php

namespace App\Http\Requests\Proveedor;

use App\Services\Auth\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            // `ignore($this->route('proveedor'))` — mismo fix que
            // StoreRoleRequest/UpdateClienteRequest.
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('proveedores', 'email')
                    ->where('empresa_id', app(TenantContext::class)->empresaId())
                    ->ignore($this->route('proveedor')),
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
            'email.unique' => 'Ya existe un proveedor con este correo en tu empresa.',
        ];
    }
}
