<?php

namespace Tests\Unit\AI;

use App\Exceptions\AIProviderException;
use App\Services\AI\OpenAIVisionService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Exercises the real HTTP-parsing path against a realistic OpenAI Responses
 * API body — every other CapturaIA test binds AIProviderInterface to
 * FakeAIProvider and never touches this class, which is how a wrong
 * response-parsing key (output_text) shipped without any test failing.
 */
class OpenAIVisionServiceTest extends TestCase
{
    public function test_parses_a_real_shaped_responses_api_body(): void
    {
        // Captured from a live call: OpenAI's raw REST body has no top-level
        // `output_text` — that convenience field only exists on the SDKs'
        // response objects. The real text sits at output[0].content[0].text.
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
                                        ['name' => 'Dog Chow', 'brand' => 'Purina', 'presentation' => '20kg', 'category' => 'Alimento', 'quantity' => 3, 'unit' => 'Bolsa', 'confidence' => 0.9],
                                    ],
                                    'movement' => 'entrada',
                                ]),
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $imagePath = tempnam(sys_get_temp_dir(), 'vision-test');
        file_put_contents($imagePath, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='));

        $result = (new OpenAIVisionService())->analyze($imagePath);

        $this->assertSame('entrada', $result->movement);
        $this->assertCount(1, $result->products);
        $this->assertSame('Dog Chow', $result->products[0]->name);

        unlink($imagePath);
    }

    public function test_throws_when_the_http_call_fails(): void
    {
        Http::fake(['*/responses' => Http::response(['error' => ['message' => 'bad key']], 401)]);

        $imagePath = tempnam(sys_get_temp_dir(), 'vision-test');
        file_put_contents($imagePath, 'not a real image');

        $this->expectException(AIProviderException::class);
        $this->expectExceptionMessage('OpenAI Vision respondió con error: 401');

        (new OpenAIVisionService())->analyze($imagePath);

        unlink($imagePath);
    }

    public function test_throws_when_the_response_has_no_output_text_content(): void
    {
        Http::fake(['*/responses' => Http::response(['id' => 'resp_test', 'output' => []], 200)]);

        $imagePath = tempnam(sys_get_temp_dir(), 'vision-test');
        file_put_contents($imagePath, 'not a real image');

        $this->expectException(AIProviderException::class);
        $this->expectExceptionMessage('OpenAI Vision no devolvió un JSON válido según el esquema esperado.');

        (new OpenAIVisionService())->analyze($imagePath);

        unlink($imagePath);
    }
}
