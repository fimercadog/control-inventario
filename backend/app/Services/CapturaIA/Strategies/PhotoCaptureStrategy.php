<?php

namespace App\Services\CapturaIA\Strategies;

use App\Contracts\AI\AIProviderInterface;
use App\Contracts\CapturaIA\CaptureStrategyInterface;
use App\DTO\AI\AIExtractionResultDTO;
use App\DTO\CapturaIA\CaptureInputDTO;
use App\Enums\CapturaIA\TipoCaptura;
use InvalidArgumentException;

class PhotoCaptureStrategy implements CaptureStrategyInterface
{
    public function __construct(
        private readonly AIProviderInterface $ai,
    ) {
    }

    public function soporta(TipoCaptura $tipo): bool
    {
        return $tipo === TipoCaptura::Foto;
    }

    public function capturar(CaptureInputDTO $input): AIExtractionResultDTO
    {
        if ($input->imagenPath === null) {
            throw new InvalidArgumentException('El modo Foto requiere imagenPath.');
        }

        return $this->ai->analyzeImage($input->imagenPath);
    }
}
