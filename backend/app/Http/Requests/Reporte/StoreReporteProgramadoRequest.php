<?php

namespace App\Http\Requests\Reporte;

use Illuminate\Foundation\Http\FormRequest;

class StoreReporteProgramadoRequest extends FormRequest
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
            'nombre' => ['required', 'string', 'max:255'],
            'tipo_reporte' => ['required', 'string'],
            'filtros' => ['sometimes', 'array'],
            'formato' => ['required', 'string', 'in:pdf,excel,csv'],
            'frecuencia' => ['required', 'string', 'in:diaria,semanal,mensual'],
            'destinatarios' => ['sometimes', 'array'],
            'destinatarios.*' => ['email'],
        ];
    }
}
