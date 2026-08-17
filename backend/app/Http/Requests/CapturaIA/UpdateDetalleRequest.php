<?php

namespace App\Http\Requests\CapturaIA;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDetalleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * `nombre_detectado` es `required` cuando está presente (no solo
     * `string`) — antes de este cierre, una corrección con nombre vacío
     * pasaba validación y, al confirmar, creaba un producto sin nombre
     * (cierre del módulo Captura IA, 2026-08-11).
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nombre_detectado' => ['sometimes', 'required', 'string', 'max:255'],
            'marca_detectado' => ['sometimes', 'nullable', 'string', 'max:255'],
            'categoria_detectado' => ['sometimes', 'nullable', 'string', 'max:255'],
            'presentacion_detectado' => ['sometimes', 'nullable', 'string', 'max:255'],
            'unidad_detectado' => ['sometimes', 'nullable', 'string', 'max:255'],
            'cantidad_detectada' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
