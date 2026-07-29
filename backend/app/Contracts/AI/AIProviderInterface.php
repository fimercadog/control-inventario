<?php

namespace App\Contracts\AI;

use App\DTO\AI\AIExtractionResultDTO;
use App\Exceptions\AIProviderException;

/**
 * Único punto de acceso a un proveedor de IA que Captura IA (Strategies)
 * puede usar. Ninguna CaptureStrategy conoce OpenAI, Claude, Gemini,
 * Ollama u OpenRouter directamente: solo esta interfaz (sección 74 del
 * master spec, punto 2). Cambiar de proveedor es cambiar un binding en el
 * container, nunca tocar Strategies ni Controllers.
 */
interface AIProviderInterface
{
    /**
     * Identificador del proveedor ('openai', 'claude', 'gemini', 'ollama',
     * 'openrouter', ...), usado para trazabilidad (capturas_ia.proveedor_ia
     * y AuditLog).
     */
    public function name(): string;

    /**
     * @throws AIProviderException
     */
    public function analyzeImage(string $imagePath): AIExtractionResultDTO;

    /**
     * Solo transcribe; no produce el contrato { products, movement }.
     * La extracción estructurada, si aplica, va por extractStructured().
     *
     * @throws AIProviderException
     */
    public function transcribeAudio(string $audioPath): string;

    /**
     * @param string[] $productosContexto Nombres ya detectados por foto (modo
     *                                    Foto + Voz), para atar la cantidad
     *                                    hablada al producto correcto.
     *
     * @throws AIProviderException
     */
    public function extractStructured(string $text, array $productosContexto = []): AIExtractionResultDTO;
}
