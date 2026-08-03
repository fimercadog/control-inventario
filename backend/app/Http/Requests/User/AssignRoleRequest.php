<?php

namespace App\Http\Requests\User;

use App\Services\Auth\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignRoleRequest extends FormRequest
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
            'role_id' => [
                'required',
                Rule::exists('roles', 'id')->where('empresa_id', app(TenantContext::class)->empresaId()),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'role_id.exists' => 'El rol seleccionado no existe en tu empresa.',
        ];
    }
}
