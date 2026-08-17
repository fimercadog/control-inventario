<?php

namespace App\Http\Requests\Categoria;

use Illuminate\Foundation\Http\FormRequest;

/**
 * `estado` (Controlled) removido de las reglas de validación 2026-08-10
 * (auditoría de RBAC del módulo): `CategoriaPolicy::update()` solo exige
 * `categorias.editar`, un permiso más laxo que `categorias.gestionar`
 * (el que exige `/deshabilitar`) — un `estado` aceptado aquí habría
 * permitido deshabilitar/habilitar una categoría con el permiso más
 * laxo, saltándose la verificación más estricta. Mismo tipo de
 * inconsistencia ya cerrada en Clientes/Proveedores/Usuarios (ADR-015).
 * El frontend nunca envió este campo desde este endpoint (verificado:
 * `categoria-form-modal.tsx` no lo incluye), así que este cambio no
 * afecta ningún flujo real — solo cierra el camino de API directa.
 */
class UpdateCategoriaRequest extends FormRequest
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
            'descripcion' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
