<?php

namespace App\Services\CapturaIA;

use App\Contracts\CapturaIA\CaptureStrategyInterface;
use App\Enums\CapturaIA\TipoCaptura;
use App\Services\CapturaIA\Strategies\CombinedCaptureStrategy;
use App\Services\CapturaIA\Strategies\PhotoCaptureStrategy;
use App\Services\CapturaIA\Strategies\VoiceCaptureStrategy;
use InvalidArgumentException;

/**
 * Decide qué CaptureStrategyInterface ejecutar según el tipo de captura,
 * sin que CapturaIAController ni CapturaIAService conozcan la lista completa
 * de estrategias soportadas. Agregar una fuente futura (código de barras,
 * QR, OCR, PDF, video) es agregar una clase aquí, no modificar un switch
 * en el Service (sección 74 del master spec, "Extensibilidad futura").
 */
class CaptureStrategyResolver
{
    /**
     * @var CaptureStrategyInterface[]
     */
    private array $estrategias;

    public function __construct(
        PhotoCaptureStrategy $foto,
        VoiceCaptureStrategy $voz,
        CombinedCaptureStrategy $fotoVoz,
    ) {
        $this->estrategias = [$foto, $voz, $fotoVoz];
    }

    public function resolver(TipoCaptura $tipo): CaptureStrategyInterface
    {
        foreach ($this->estrategias as $estrategia) {
            if ($estrategia->soporta($tipo)) {
                return $estrategia;
            }
        }

        throw new InvalidArgumentException("No hay una CaptureStrategy registrada para el tipo '{$tipo->value}'.");
    }
}
