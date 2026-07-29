<?php

namespace App\Http\Requests\CapturaIA;

use Illuminate\Foundation\Http\FormRequest;

class StoreFotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        // auth:api ya exige un usuario autenticado (Módulo 1); la
        // pertenencia a empresa se resuelve del propio usuario, nunca del
        // request (Módulo 2 — Company Isolation).
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'imagen' => ['required', 'image', 'max:10240'],
        ];
    }
}
