<?php

namespace Tests\Unit\AI;

use App\Exceptions\AIProviderException;
use App\Services\AI\OpenAIResponsesService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Same real-shaped-response coverage as OpenAIVisionServiceTest, for the
 * sibling class used by Voz and Foto+Voz (text -> structured extraction).
 */
class OpenAIResponsesServiceTest extends TestCase
{
    public function test_parses_a_real_shaped_responses_api_body(): void
    {
        Http::fake([
            '*/responses' => Http::response([
                'id' => 'resp_test',
                'output' => [
                    [
                        'type' => 'message',
                        'content' => [
                            [
                                'type' => 'output_text',
                                'text' => json_encode([
                                    'products' => [
                                        ['name' => 'Dog Chow', 'brand' => null, 'presentation' => null, 'category' => null, 'quantity' => 5, 'unit' => null, 'confidence' => 0.8],
                                    ],
                                    'movement' => 'entrada',
                                ]),
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $result = (new OpenAIResponsesService())->extract('Entraron cinco Dog Chow');

        $this->assertSame('entrada', $result->movement);
        $this->assertCount(1, $result->products);
        $this->assertSame(5.0, $result->products[0]->quantity);
    }

    public function test_throws_when_the_http_call_fails(): void
    {
        Http::fake(['*/responses' => Http::response(['error' => ['message' => 'boom']], 500)]);

        $this->expectException(AIProviderException::class);
        $this->expectExceptionMessage('OpenAI Responses API respondió con error: 500');

        (new OpenAIResponsesService())->extract('cualquier texto');
    }

    public function test_throws_when_the_response_has_no_output_text_content(): void
    {
        Http::fake(['*/responses' => Http::response(['id' => 'resp_test', 'output' => []], 200)]);

        $this->expectException(AIProviderException::class);
        $this->expectExceptionMessage('OpenAI Responses API no devolvió un JSON válido según el esquema esperado.');

        (new OpenAIResponsesService())->extract('cualquier texto');
    }
}
