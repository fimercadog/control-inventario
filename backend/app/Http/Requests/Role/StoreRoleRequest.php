<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
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
            // Un rol es único por (empresa_id, name, guard_name) — Spatie
            // ya lo exige a nivel de base de datos (constraint real), pero
            // sin esta regla de validación el intento de duplicar lanzaba
            // `RoleAlreadyExists` sin capturar, violando "no raw
            // exceptions" (bug real encontrado en verificación de
            // navegador, antes de este fix). `empresa_id` sale del usuario
            // autenticado, nunca del payload.
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')
                    ->where('guard_name', 'api')
                    ->where('empresa_id', $this->user()?->empresa_id),
            ],
            'estado' => ['sometimes', 'string', 'in:activo,inactivo'],
            'permisos' => ['sometimes', 'array'],
            'permisos.*' => [
                'string',
                Rule::exists('permissions', 'name')->where('guard_name', 'api'),
                // docs/security/ROLES_MATRIX.md, sección 7, punto 3:
                // namespace reservado permanente, nunca asignable a un rol
                // de empresa — validado aquí, no solo documentado.
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
