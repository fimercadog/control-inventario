<?php

namespace App\Http\Requests\Role;

use App\Services\Auth\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
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
            // Mismo fix que StoreRoleRequest — `ignore()` sobre el propio
            // id para que renombrar un rol a su mismo nombre actual (o
            // dejarlo sin cambios) nunca cuente como conflicto consigo mismo.
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('roles', 'name')
                    ->where('guard_name', 'api')
                    ->where('empresa_id', app(TenantContext::class)->empresaId())
                    ->ignore($this->route('role')),
            ],
            'estado' => ['sometimes', 'string', 'in:activo,inactivo'],
            'permisos' => ['sometimes', 'array'],
            'permisos.*' => [
                'string',
                Rule::exists('permissions', 'name')->where('guard_name', 'api'),
                'not_regex:/^plataforma\./',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'Ya existe un rol con este nombre en tu empresa.',
            'permisos.*.not_regex' => 'El permiso :input pertenece al namespace reservado de plataforma y no puede asignarse a un rol de empresa.',
            'permisos.*.exists' => 'El permiso :input no existe en el catálogo.',
        ];
    }
}
