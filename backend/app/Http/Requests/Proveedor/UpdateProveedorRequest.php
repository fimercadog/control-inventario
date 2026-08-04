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
            // `filled` (no solo `string`): un PATCH que envía `nombre` no
            // puede vaciarlo — `nombre` es el campo de identidad del
            // registro (auditoría de campos editables, 2026-08-04).
            'nombre' => ['sometimes', 'filled', 'string', 'max:255'],
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
            // `estado` deliberadamente fuera de esta lista: cambiarlo debe
            // pasar únicamente por los endpoints dedicados
            // /habilitar y /deshabilitar (permiso y accion de auditoría
            // correctos por separado — `proveedores.gestionar` para
            // deshabilitar, no `proveedores.editar`). Si se envía aquí, se
            // ignora en silencio (mismo patrón que `empresa_id`/`id`, que
            // tampoco están en esta lista) — auditoría de campos editables,
            // 2026-08-04.
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
