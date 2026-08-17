<?php

namespace App\Services\AI;

use App\Contracts\AI\SpeechTranscriberInterface;
use App\Exceptions\AIProviderException;
use Illuminate\Support\Facades\Http;

/**
 * Transcribe un audio a texto usando OpenAI Speech to Text.
 * Solo transcribe; la extracción de producto/cantidad la hace
 * StructuredExtractorInterface a partir del texto resultante.
 */
class OpenAISpeechService implements SpeechTranscriberInterface
{
    public function transcribe(string $audioPath): string
    {
        $response = Http::withToken(config('services.openai.key'))
            ->timeout((int) config('services.openai.timeout'))
            ->baseUrl(config('services.openai.base_url'))
            ->attach('file', file_get_contents($audioPath) ?: '', basename($audioPath))
            ->post('/audio/transcriptions', [
                'model' => config('services.openai.speech_model'),
            ]);

        if ($response->failed()) {
            throw new AIProviderException("OpenAI Speech to Text respondió con error: {$response->status()}");
        }

        $texto = $response->json('text');

        if (! is_string($texto) || trim($texto) === '') {
            throw new AIProviderException('OpenAI Speech to Text no devolvió una transcripción válida.');
        }

        return $texto;
    }
}
