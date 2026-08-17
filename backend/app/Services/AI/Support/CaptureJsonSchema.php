<?php

namespace App\Services\AI\Support;

/**
 * Esquema JSON compartido por OpenAIVisionService y OpenAIResponsesService
 * para forzar, vía structured outputs, el contrato único
 * { "products": [...], "movement": "..." } (sección 74 del master spec).
 * Ningún Service/AI acepta ni parsea texto libre del proveedor.
 */
final class CaptureJsonSchema
{
    public static function name(): string
    {
        return 'captura_ia_result';
    }

    /**
     * @return array<string, mixed>
     */
    public static function schema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'products' => [
                    'type' => 'array',
                    'items' => [
                        'type' => 'object',
                        'properties' => [
                            'name' => ['type' => 'string'],
                            'brand' => ['type' => ['string', 'null']],
                            'presentation' => ['type' => ['string', 'null']],
                            'category' => ['type' => ['string', 'null']],
                            'quantity' => ['type' => 'number'],
                            'unit' => ['type' => ['string', 'null']],
                            'confidence' => ['type' => 'number'],
                        ],
                        'required' => ['name', 'brand', 'presentation', 'category', 'quantity', 'unit', 'confidence'],
                        'additionalProperties' => false,
                    ],
                ],
                'movement' => [
                    'type' => 'string',
                    'enum' => ['entrada', 'salida', 'ajuste', 'conteo', 'transferencia'],
                ],
            ],
            'required' => ['products', 'movement'],
            'additionalProperties' => false,
        ];
    }
}
