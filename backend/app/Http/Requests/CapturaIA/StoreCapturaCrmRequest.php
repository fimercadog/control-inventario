<?php

namespace App\Http\Requests\CapturaIA;

use Illuminate\Foundation\Http\FormRequest;

class StoreCapturaCrmRequest extends FormRequest
{
    public function authorize(): bool { return true; }
    public function rules(): array { return ['entidad' => ['required', 'in:contacto,oportunidad,actividad'], 'contenido' => ['required', 'string', 'min:3', 'max:6000']]; }
}
