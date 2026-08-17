<?php

namespace App\Services\AI;

use App\Contracts\AI\StructuredExtractorInterface;
use App\DTO\AI\StructuredExtractionDTO;
use App\Exceptions\AIProviderException;
use App\Services\AI\Support\CaptureJsonSchema;
use Illuminate\Support\Facades\Http;

/**
 * Convierte lenguaje natural (transcripción de voz) en
 * { "products": [...], "movement": "..." } usando OpenAI Responses API
 * con structured outputs. Usado por VoiceCaptureStrategy y, para el texto
 * hablado, por CombinedCaptureStrategy.
 */
class OpenAIResponsesService implements StructuredExtractorInterface
{
    private const PROMPT = <<<'PROMPT'
        Extrae del texto hablado por un usuario de bodega los productos
        mencionados y el tipo de movimiento (entrada, salida, ajuste, conteo
        o transferencia). Si el texto no indica movimiento explícito, usa
        "entrada" por defecto. No inventes marca, categoría o presentación si
        no se mencionan: usa null y baja confidence.
        PROMPT;

    public function extract(string $text, array $productosContexto = []): StructuredExtractionDTO
    {
        $contexto = $productosContexto === []
            ? ''
            : "\n\nProductos ya identificados en la foto (usa estos nombres si el texto los referencia): "
                .implode(', ', $productosContexto);

        $response = Http::withToken(config('services.openai.key'))
            ->timeout((int) config('services.openai.timeout'))
            ->baseUrl(config('services.openai.base_url'))
            ->post('/responses', [
                'model' => config('services.openai.responses_model'),
                'input' => [
                    [
                        'role' => 'user',
                        'content' => [
                            ['type' => 'input_text', 'text' => self::PROMPT."{$contexto}\n\nTexto: {$text}"],
                        ],
                    ],
                ],
                'text' => [
                    'format' => [
                        'type' => 'json_schema',
                        'name' => CaptureJsonSchema::name(),
                        'schema' => CaptureJsonSchema::schema(),
                        'strict' => true,
                    ],
                ],
            ]);

        if ($response->failed()) {
            throw new AIProviderException("OpenAI Responses API respondió con error: {$response->status()}");
        }

        $decoded = json_decode($response->json('output_text') ?? '', true);

        if (! is_array($decoded)) {
            throw new AIProviderException('OpenAI Responses API no devolvió un JSON válido según el esquema esperado.');
        }

        return StructuredExtractionDTO::fromArray($decoded);
    }
}
