<?php

namespace App\Services\AI;

class CrmCaptureExtractionService
{
    public function extract(string $entidad, string $contenido): array
    {
        $resumen = mb_substr(trim($contenido), 0, 140);
        preg_match('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $contenido, $email);
        preg_match('/\$?\s*([\d][\d.,]*)/', $contenido, $monto);

        return match ($entidad) {
            'contacto' => ['nombre' => 'Contacto demo', 'apellido' => null, 'email' => $email[0] ?? null, 'telefono' => null, 'cargo' => 'Contacto comercial', 'confianza' => 0.82, 'evidencia_demo' => $resumen],
            'oportunidad' => ['nombre' => 'Oportunidad demo', 'monto' => isset($monto[1]) ? (float) str_replace([',', '.'], ['', '.'], $monto[1]) : null, 'fecha_cierre_estimada' => null, 'descripcion' => $resumen, 'confianza' => 0.80, 'evidencia_demo' => $resumen],
            default => ['tipo' => 'tarea', 'asunto' => 'Seguimiento comercial demo', 'descripcion' => $resumen, 'programada_para' => null, 'confianza' => 0.84, 'evidencia_demo' => $resumen],
        };
    }
}
