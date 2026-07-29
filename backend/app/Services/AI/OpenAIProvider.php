<?php

namespace App\Services\AI;

use App\Contracts\AI\AIProviderInterface;
use App\Contracts\AI\SpeechTranscriberInterface;
use App\Contracts\AI\StructuredExtractorInterface;
use App\Contracts\AI\VisionAnalyzerInterface;
use App\DTO\AI\AIExtractionResultDTO;

/**
 * Implementación OpenAI de AIProviderInterface. Compone las llamadas
 * específicas (Vision, Speech to Text, Responses API) detrás de una única
 * fachada; Strategies nunca ven estas tres clases, solo esta.
 * Sustituir por ClaudeProvider/GeminiProvider/OllamaProvider/
 * OpenRouterProvider es solo cambiar el binding en AppServiceProvider.
 */
class OpenAIProvider implements AIProviderInterface
{
    public function __construct(
        private readonly VisionAnalyzerInterface $vision,
        private readonly SpeechTranscriberInterface $speech,
        private readonly StructuredExtractorInterface $extractor,
    ) {
    }

    public function name(): string
    {
        return 'openai';
    }

    public function analyzeImage(string $imagePath): AIExtractionResultDTO
    {
        $inicio = microtime(true);
        $resultado = $this->vision->analyze($imagePath);

        return new AIExtractionResultDTO(
            data: $resultado,
            provider: $this->name(),
            processingTimeMs: $this->milisegundosDesde($inicio),
        );
    }

    public function transcribeAudio(string $audioPath): string
    {
        return $this->speech->transcribe($audioPath);
    }

    public function extractStructured(string $text, array $productosContexto = []): AIExtractionResultDTO
    {
        $inicio = microtime(true);
        $resultado = $this->extractor->extract($text, $productosContexto);

        return new AIExtractionResultDTO(
            data: $resultado,
            provider: $this->name(),
            processingTimeMs: $this->milisegundosDesde($inicio),
        );
    }

    private function milisegundosDesde(float $inicioMicrotime): int
    {
        return (int) round((microtime(true) - $inicioMicrotime) * 1000);
    }
}
