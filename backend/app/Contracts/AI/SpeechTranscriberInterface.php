<?php

namespace App\Contracts\AI;

use App\Exceptions\AIProviderException;

/**
 * Transcribe un audio a texto. Implementación por defecto: OpenAISpeechService
 * (OpenAI Speech to Text). El texto resultante alimenta StructuredExtractorInterface.
 */
interface SpeechTranscriberInterface
{
    /**
     * @throws AIProviderException si el proveedor no puede transcribir el audio.
     */
    public function transcribe(string $audioPath): string;
}
