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
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'nombre_detectado' => ['sometimes', 'string', 'max:255'],
            'marca_detectado' => ['sometimes', 'nullable', 'string', 'max:255'],
            'categoria_detectado' => ['sometimes', 'nullable', 'string', 'max:255'],
            'presentacion_detectado' => ['sometimes', 'nullable', 'string', 'max:255'],
            'unidad_detectado' => ['sometimes', 'nullable', 'string', 'max:255'],
            'cantidad_detectada' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
