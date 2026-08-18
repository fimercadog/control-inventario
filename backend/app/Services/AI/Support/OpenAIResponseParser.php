<?php

namespace App\Services\AI\Support;

/**
 * OpenAI's Responses API has no top-level `output_text` key in the raw
 * HTTP body — that convenience field only exists on the official SDKs'
 * response objects (computed client-side). The real text sits at
 * output[].content[].text, on the first `message`-type output item's
 * first `output_text`-type content block. Shared by OpenAIVisionService
 * and OpenAIResponsesService, both of which call /responses directly via
 * Http:: without an SDK.
 */
final class OpenAIResponseParser
{
    /**
     * @param array<string, mixed> $body
     */
    public static function extractOutputText(array $body): ?string
    {
        foreach ($body['output'] ?? [] as $item) {
            if (($item['type'] ?? null) !== 'message') {
                continue;
            }

            foreach ($item['content'] ?? [] as $content) {
                if (($content['type'] ?? null) === 'output_text' && is_string($content['text'] ?? null)) {
                    return $content['text'];
                }
            }
        }

        return null;
    }
}
