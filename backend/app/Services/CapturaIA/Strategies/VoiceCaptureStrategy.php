<?php

namespace App\Services\CapturaIA\Strategies;

use App\Contracts\AI\AIProviderInterface;
use App\Contracts\CapturaIA\CaptureStrategyInterface;
use App\DTO\AI\AIExtractionResultDTO;
use App\DTO\CapturaIA\CaptureInputDTO;
use App\Enums\CapturaIA\TipoCaptura;
use InvalidArgumentException;

class VoiceCaptureStrategy implements CaptureStrategyInterface
{
    public function __construct(
        private readonly AIProviderInterface $ai,
    ) {
    }

    public function soporta(TipoCaptura $tipo): bool
    {
        return $tipo === TipoCaptura::Voz;
    }

    public function capturar(CaptureInputDTO $input): AIExtractionResultDTO
    {
        if ($input->audioPath === null) {
            throw new InvalidArgumentException('El modo Voz requiere audioPath.');
        }

        $inicio = microtime(true);
        $transcripcion = $this->ai->transcribeAudio($input->audioPath);
        $tiempoTranscripcion = (int) round((microtime(true) - $inicio) * 1000);

        $resultado = $this->ai->extractStructured($transcripcion);

        return new AIExtractionResultDTO(
            data: $resultado->data->withTranscript($transcripcion),
            provider: $resultado->provider,
            processingTimeMs: $tiempoTranscripcion + $resultado->processingTimeMs,
        );
    }
}
