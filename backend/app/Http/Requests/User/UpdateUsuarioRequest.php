<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * ADR-015 (modelo de identidad ERP), decisión del propietario del
 * proyecto 2026-08-04: un administrador con `usuarios.editar` puede
 * modificar los campos Operational de OTRO usuario de su empresa
 * (`theme`/`language`/`timezone` aquí; `avatar` tiene su propio endpoint
 * de archivo, igual que en Perfil). `name`/`email` son Identity —
 * deliberadamente fuera de esta lista, igual que en `UpdateProfileRequest`.
 * Mismas reglas que `UpdateProfileRequest` tenía para estos tres campos.
 */
class UpdateUsuarioRequest extends FormRequest
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
            'theme' => ['sometimes', 'string', Rule::in(['light', 'dark', 'system'])],
            'language' => ['sometimes', 'string', Rule::in(['es', 'en'])],
            'timezone' => ['sometimes', 'string', 'timezone:all'],
        ];
    }
}
