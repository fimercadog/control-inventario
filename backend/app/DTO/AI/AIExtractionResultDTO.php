<?php

namespace App\DTO\AI;

/**
 * Envoltorio que cualquier AIProviderInterface devuelve junto con la
 * extracción en sí: qué proveedor respondió y cuánto tardó. Alimenta
 * directamente el AuditLog de cada captura (sección 74 del master spec,
 * puntos 2 y 5) sin que Captura IA tenga que volver a medir nada ni
 * conocer detalles del proveedor.
 */
final readonly class AIExtractionResultDTO
{
    public function __construct(
        public StructuredExtractionDTO $data,
        public string $provider,
        public int $processingTimeMs,
    ) {
    }
}
