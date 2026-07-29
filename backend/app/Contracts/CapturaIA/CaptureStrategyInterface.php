<?php

namespace App\Contracts\CapturaIA;

use App\DTO\AI\AIExtractionResultDTO;
use App\DTO\CapturaIA\CaptureInputDTO;
use App\Enums\CapturaIA\TipoCaptura;

/**
 * Contrato Open/Closed para agregar nuevas fuentes de captura sin tocar
 * CapturaIAService ni el Controller: cada fuente (foto, voz, foto+voz, y a
 * futuro código de barras/QR/OCR/PDF/video) implementa esta interfaz y se
 * registra en CaptureStrategyResolver (sección 74 del master spec,
 * "Extensibilidad futura"). Una Strategy solo puede depender de
 * AIProviderInterface para hablar con la IA — nunca de una clase de
 * proveedor concreta (sección 74, punto 2).
 */
interface CaptureStrategyInterface
{
    public function soporta(TipoCaptura $tipo): bool;

    public function capturar(CaptureInputDTO $input): AIExtractionResultDTO;
}
