<?php

namespace App\DTO\CapturaIA;

use App\Enums\CapturaIA\TipoCaptura;
use Illuminate\Support\Str;

/**
 * Entrada normalizada que el Controller entrega a CapturaIAService,
 * independiente de si el archivo llegó como foto, audio o ambos.
 * `imagenPath`/`audioPath` deben ser rutas de archivos YA persistidos
 * (originales, sin procesar) en Storage — nunca la ruta temporal de
 * subida — para cumplir la auditoría de la sección 74, punto 4.
 */
final readonly class CaptureInputDTO
{
    public string $uuid;

    public function __construct(
        public TipoCaptura $tipo,
        public int $empresaId,
        public ?int $usuarioId,
        public ?string $imagenPath = null,
        public ?string $audioPath = null,
        ?string $uuid = null,
        public ?string $idempotencyKey = null,
    ) {
        $this->uuid = $uuid ?? (string) Str::uuid();
    }
}
