<?php

namespace App\Services\Audit;

use App\DTO\AI\AIExtractionResultDTO;
use App\Models\AuditLog;
use App\Models\CapturaIA;

/**
 * Escribe el rastro de auditoría de cada captura de IA (sección 74 del
 * master spec, punto 5): tipo de captura, proveedor, confianza, tiempo de
 * procesamiento, usuario, empresa y resultado. Un registro por captura,
 * inmutable (AuditLog no permite update/delete).
 */
class AuditLogger
{
    public function registrarCapturaIA(
        CapturaIA $captura,
        AIExtractionResultDTO $resultadoIA,
        ?string $ip = null,
        ?string $userAgent = null,
    ): AuditLog {
        return AuditLog::create([
            'empresa_id' => $captura->empresa_id,
            'usuario_id' => $captura->usuario_id,
            'modulo' => 'captura_ia',
            'accion' => 'captura_ia.procesar',
            'auditable_type' => CapturaIA::class,
            'auditable_id' => $captura->id,
            'valores_nuevos' => [
                'tipo' => $captura->tipo->value,
                'proveedor' => $resultadoIA->provider,
                'confianza_promedio' => (float) $captura->confianza_promedio,
                'tiempo_procesamiento_ms' => $resultadoIA->processingTimeMs,
            ],
            'resultado' => $captura->estado->value,
            'ip' => $ip,
            'user_agent' => $userAgent,
        ]);
    }
}
