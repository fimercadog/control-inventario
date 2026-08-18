<?php

namespace App\Http\Requests\Contingencia;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SincronizarActividadRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array
    {
        return [
            'operacion_id' => ['required', 'uuid'],
            'payload' => ['required', 'array'],
            'payload.tipo' => ['required', Rule::in(['llamada', 'correo', 'reunion', 'tarea', 'nota'])],
            'payload.asunto' => ['required', 'string', 'max:200'],
            'payload.descripcion' => ['nullable', 'string'],
            'payload.programada_para' => ['nullable', 'date'],
        ];
    }
}
