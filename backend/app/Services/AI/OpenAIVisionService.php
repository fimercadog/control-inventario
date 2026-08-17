<?php

namespace App\Services\AI;

use App\Contracts\AI\VisionAnalyzerInterface;
use App\DTO\AI\StructuredExtractionDTO;
use App\Exceptions\AIProviderException;
use App\Services\AI\Support\CaptureJsonSchema;
use Illuminate\Support\Facades\Http;

/**
 * Traduce una imagen a { "products": [...], "movement": "..." } usando
 * OpenAI Vision (Responses API con structured outputs). No conoce
 * `productos` ni `movimientos`: solo produce un StructuredExtractionDTO.
 */
class OpenAIVisionService implements VisionAnalyzerInterface
{
    private const PROMPT = <<<'PROMPT'
        Analiza la imagen de un inventario o bodega. Detecta TODOS los productos
        visibles, no solo el principal (puede ser un solo producto, varios
        productos iguales, varios productos diferentes, una estantería, un
        pallet o una bodega completa). Si hay N unidades iguales del mismo
        producto, súmalas en una sola entrada con quantity = N; no repitas la
        misma entrada N veces. Si no estás seguro de un dato, no lo inventes:
        baja el valor de confidence en vez de adivinar.
        PROMPT;

    public function analyze(string $imagePath): StructuredExtractionDTO
    {
        $mime = mime_content_type($imagePath) ?: 'image/jpeg';
        $encoded = base64_encode(file_get_contents($imagePath) ?: '');

        $response = Http::withToken(config('services.openai.key'))
            ->timeout((int) config('services.openai.timeout'))
            ->baseUrl(config('services.openai.base_url'))
            ->post('/responses', [
                'model' => config('services.openai.vision_model'),
                'input' => [
                    [
                        'role' => 'user',
                        'content' => [
                            ['type' => 'input_text', 'text' => self::PROMPT],
                            ['type' => 'input_image', 'image_url' => "data:{$mime};base64,{$encoded}"],
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
            throw new AIProviderException("OpenAI Vision respondió con error: {$response->status()}");
        }

        $decoded = json_decode($response->json('output_text') ?? '', true);

        if (! is_array($decoded)) {
            throw new AIProviderException('OpenAI Vision no devolvió un JSON válido según el esquema esperado.');
        }

        return StructuredExtractionDTO::fromArray($decoded);
    }
}
