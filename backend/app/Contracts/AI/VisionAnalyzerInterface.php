<?php

namespace App\Contracts\AI;

use App\DTO\AI\StructuredExtractionDTO;
use App\Exceptions\AIProviderException;

/**
 * Colaborador interno de un AIProviderInterface (ej. OpenAIProvider) para
 * la llamada específica de visión. Nada fuera de Services/AI/* depende de
 * esta interfaz directamente: Strategies solo conocen AIProviderInterface
 * (ver sección 74 del master spec, punto 2).
 */
interface VisionAnalyzerInterface
{
    /**
     * @throws AIProviderException si el proveedor no cumple el esquema esperado.
     */
    public function analyze(string $imagePath): StructuredExtractionDTO;
}
