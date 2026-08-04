<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Perfil (2026-08-02). Modelo de identidad ERP (ADR-015, auditoría de
 * campos editables 2026-08-04): `name`/`email` son campos de identidad —
 * inmutables después de la creación de la cuenta (fijados al aceptar la
 * invitación, `InvitationService::aceptar()`), igual que `empresa_id`.
 * `email` ya estaba deliberadamente fuera de esta lista (cambiar el correo
 * de inicio de sesión implicaría un flujo de re-verificación propio, fuera
 * de alcance); `name` se une desde 2026-08-04 — antes era editable aquí.
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
            'theme' => ['sometimes', 'string', Rule::in(['light', 'dark', 'system'])],
            // Ningún texto de la UI se traduce todavía según este campo
            // (la app es 100% español hardcodeado hoy) — se persiste de
            // forma honesta como preferencia, ver docs/03_FUNCTIONAL_SPEC/Profile.md.
            'language' => ['sometimes', 'string', Rule::in(['es', 'en'])],
            'timezone' => ['sometimes', 'string', 'timezone:all'],
        ];
    }
}
