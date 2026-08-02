<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Perfil (2026-08-02). Solo datos personales — `email` deliberadamente
 * fuera de esta lista: cambiar el correo de inicio de sesión implicaría
 * un flujo de re-verificación propio, fuera de alcance de este módulo.
 */
class UpdateProfileRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'theme' => ['sometimes', 'string', Rule::in(['light', 'dark', 'system'])],
            // Ningún texto de la UI se traduce todavía según este campo
            // (la app es 100% español hardcodeado hoy) — se persiste de
            // forma honesta como preferencia, ver docs/03_FUNCTIONAL_SPEC/Profile.md.
            'language' => ['sometimes', 'string', Rule::in(['es', 'en'])],
            'timezone' => ['sometimes', 'string', 'timezone:all'],
        ];
    }
}
