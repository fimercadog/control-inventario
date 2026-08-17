<?php

namespace Tests\Support\Fakes;

use App\Contracts\AI\AIProviderInterface;
use App\DTO\AI\AIExtractionResultDTO;
use App\DTO\AI\StructuredExtractionDTO;

/**
 * Doble de pruebas para AIProviderInterface: permite verificar
 * CapturaIAService y las Strategies sin llamar a OpenAI de verdad, y sin
 * que el test conozca ninguna clase específica de proveedor (sección 74
 * del master spec, punto 2).
 */
class FakeAIProvider implements AIProviderInterface
{
    public function __construct(
        private readonly ?StructuredExtractionDTO $resultadoImagen = null,
        private readonly string $transcripcion = '',
        private readonly ?StructuredExtractionDTO $resultadoTexto = null,
    ) {
    }

    public function name(): string
    {
        return 'fake';
    }

    public function analyzeImage(string $imagePath): AIExtractionResultDTO
    {
        return new AIExtractionResultDTO($this->resultadoImagen, $this->name(), 1);
    }

    public function transcribeAudio(string $audioPath): string
    {
        return $this->transcripcion;
    }

    public function extractStructured(string $text, array $productosContexto = []): AIExtractionResultDTO
    {
        return new AIExtractionResultDTO($this->resultadoTexto, $this->name(), 1);
    }
}
