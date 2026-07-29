<?php

namespace App\Http\Requests\CapturaIA;

use Illuminate\Foundation\Http\FormRequest;

class StoreFotoVozRequest extends FormRequest
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
            'imagen' => ['required', 'image', 'max:10240'],
            'audio' => ['required', 'file', 'mimes:mp3,wav,m4a,ogg,webm', 'max:20480'],
        ];
    }
}
