<?php

namespace App\Services\AI;

use App\Exceptions\AIProviderException;
use App\Services\AI\Support\OpenAIResponseParser;
use Illuminate\Support\Facades\Http;

class CrmCaptureExtractionService
{
    public function extract(string $entidad, string $contenido): array
    {
        $schema = $this->schema($entidad);
        $response = Http::withToken(config('services.openai.key'))->timeout((int) config('services.openai.timeout'))->baseUrl(config('services.openai.base_url'))->post('/responses', [
            'model' => config('services.openai.responses_model'),
            'input' => [[
                'role' => 'user',
                'content' => [[
                    'type' => 'input_text',
                    'text' => "Extrae únicamente datos explícitos para un {$entidad} de CRM. No inventes datos; usa null cuando falten. Texto: {$contenido}",
                ]],
            ]],
            'text' => ['format' => ['type' => 'json_schema', 'name' => "captura_crm_{$entidad}", 'schema' => $schema, 'strict' => true]],
        ]);
        if ($response->failed()) throw new AIProviderException("OpenAI Responses API respondió con error: {$response->status()}");
        $data = json_decode(OpenAIResponseParser::extractOutputText($response->json() ?? []) ?? '', true);
        if (!is_array($data)) throw new AIProviderException('La IA no devolvió una propuesta CRM válida.');
        return $data;
    }

    private function schema(string $entidad): array
    {
        $fields = match ($entidad) {
            'contacto' => ['nombre' => ['type' => ['string', 'null']], 'apellido' => ['type' => ['string', 'null']], 'email' => ['type' => ['string', 'null']], 'telefono' => ['type' => ['string', 'null']], 'cargo' => ['type' => ['string', 'null']]],
            'oportunidad' => ['nombre' => ['type' => ['string', 'null']], 'monto' => ['type' => ['number', 'null']], 'fecha_cierre_estimada' => ['type' => ['string', 'null']], 'descripcion' => ['type' => ['string', 'null']]],
            default => ['tipo' => ['type' => ['string', 'null']], 'asunto' => ['type' => ['string', 'null']], 'descripcion' => ['type' => ['string', 'null']], 'programada_para' => ['type' => ['string', 'null']]],
        };
        $fields['confianza'] = ['type' => 'number'];
        return ['type' => 'object', 'properties' => $fields, 'required' => array_keys($fields), 'additionalProperties' => false];
    }
}
