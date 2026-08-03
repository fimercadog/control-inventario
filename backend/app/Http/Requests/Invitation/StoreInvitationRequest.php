<?php

namespace App\Http\Requests\Invitation;

use App\Services\Auth\TenantContext;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvitationRequest extends FormRequest
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
            'email' => ['required', 'email', Rule::unique('users', 'email')],
            'role_id' => [
                'nullable',
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
            'email.unique' => 'Ya existe una cuenta con este correo.',
            'role_id.exists' => 'El rol seleccionado no existe en tu empresa.',
        ];
    }
}
