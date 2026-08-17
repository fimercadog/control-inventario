<?php

namespace App\Contracts\AI;

use App\DTO\AI\StructuredExtractionDTO;
use App\Exceptions\AIProviderException;

/**
 * Colaborador interno de un AIProviderInterface (ej. OpenAIProvider) para
 * la llamada específica de extracción estructurada de texto. Nada fuera
 * de Services/AI/* depende de esta interfaz directamente (sección 74,
 * punto 2).
 */
interface StructuredExtractorInterface
{
    /**
     * @param string[] $productosContexto Nombres de productos ya detectados por
     *                                    foto (modo Foto + Voz), para que la IA
     *                                    ate la cantidad hablada al producto
     *                                    correcto en vez de adivinar cuál es.
     *
     * @throws AIProviderException si el proveedor no puede cumplir el esquema.
     */
    public function extract(string $text, array $productosContexto = []): StructuredExtractionDTO;
}
