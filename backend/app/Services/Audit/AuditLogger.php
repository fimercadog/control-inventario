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

    /**
     * Registro de auditoría genérico para acciones manuales fuera de
     * Captura IA (docs/03_FUNCTIONAL_SPEC/Products.md, Adenda 2 —
     * FEATURE-001/002). Reutiliza la misma tabla `audit_logs` ya
     * existente e inmutable. El módulo de consulta genérica
     * (`docs/03_FUNCTIONAL_SPEC/Auditoria.md`) ya está construido y
     * cerrado (2026-08-02, cierre definitivo 2026-08-11) — este método
     * es uno de sus 14 escritores reales, no un borrador.
     *
     * @param array<string, mixed> $valoresNuevos
     */
    public function registrarAccionManual(
        int $empresaId,
        ?int $usuarioId,
        string $modulo,
        string $accion,
        string $auditableType,
        int $auditableId,
        array $valoresNuevos,
        string $resultado = 'exitoso',
        ?string $ip = null,
        ?string $userAgent = null,
    ): AuditLog {
        return AuditLog::create([
            'empresa_id' => $empresaId,
            'usuario_id' => $usuarioId,
            'modulo' => $modulo,
            'accion' => $accion,
            'auditable_type' => $auditableType,
            'auditable_id' => $auditableId,
            'valores_nuevos' => $valoresNuevos,
            'resultado' => $resultado,
            'ip' => $ip,
            'user_agent' => $userAgent,
        ]);
    }
}
