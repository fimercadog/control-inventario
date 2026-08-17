<?php

namespace App\Http\Requests\Profile;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;

/**
 * Perfil (2026-08-02). "Cambiar mi contraseña" mientras autenticado —
 * distinto del flujo "olvidé mi contraseña" (Auth\ResetPasswordRequest,
 * sin sesión, vía token de email). Exige la contraseña actual para no
 * permitir que una sesión robada (ej. dispositivo desatendido) cambie la
 * contraseña sin conocerla.
 */
class ChangePasswordRequest extends FormRequest
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
            'password_actual' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if (! Hash::check($this->string('password_actual'), $this->user()->password)) {
                $validator->errors()->add('password_actual', 'La contraseña actual no es correcta.');
            }
        });
    }
}
