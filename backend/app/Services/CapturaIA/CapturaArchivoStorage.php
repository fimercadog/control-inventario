<?php

namespace App\Services\CapturaIA;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Guarda el archivo ORIGINAL (imagen o audio) tal como llegó, antes de
 * cualquier procesamiento de IA, en el disco privado 'local'. Es lo único
 * que se persiste como evidencia de auditoría — nunca solo el dato ya
 * extraído (sección 74 del master spec, punto 4). Usado por los
 * Controllers antes de construir un CaptureInputDTO.
 */
class CapturaArchivoStorage
{
    private const DISCO = 'local';

    public function guardarImagen(UploadedFile $archivo, int $empresaId, string $uuid): string
    {
        return $this->guardar($archivo, $empresaId, $uuid, 'foto');
    }

    public function guardarAudio(UploadedFile $archivo, int $empresaId, string $uuid): string
    {
        return $this->guardar($archivo, $empresaId, $uuid, 'audio');
    }

    private function guardar(UploadedFile $archivo, int $empresaId, string $uuid, string $nombreBase): string
    {
        $extension = $archivo->extension() ?: 'bin';
        $ruta = $archivo->storeAs(
            "capturas-ia/{$empresaId}/{$uuid}",
            "{$nombreBase}.{$extension}",
            self::DISCO,
        );

        return Storage::disk(self::DISCO)->path($ruta);
    }
}
