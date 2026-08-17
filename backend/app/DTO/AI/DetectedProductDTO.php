<?php

namespace App\DTO\AI;

/**
 * Un elemento del arreglo `products` del contrato de IA. Vive en el
 * namespace AI (no CapturaIA) porque cualquier proveedor (OpenAI, Claude,
 * Gemini, Ollama, OpenRouter) y cualquier consumidor futuro (no solo
 * Captura IA) puede producir/recibir esta forma de dato
 * (ver docs/00_MASTER_SPECIFICATION.md sección 74).
 */
final readonly class DetectedProductDTO
{
    public function __construct(
        public string $name,
        public ?string $brand,
        public ?string $presentation,
        public ?string $category,
        public float $quantity,
        public ?string $unit,
        public float $confidence,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            name: (string) ($data['name'] ?? ''),
            brand: $data['brand'] ?? null,
            presentation: $data['presentation'] ?? null,
            category: $data['category'] ?? null,
            quantity: (float) ($data['quantity'] ?? 0),
            unit: $data['unit'] ?? null,
            confidence: (float) ($data['confidence'] ?? 0),
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'name' => $this->name,
            'brand' => $this->brand,
            'presentation' => $this->presentation,
            'category' => $this->category,
            'quantity' => $this->quantity,
            'unit' => $this->unit,
            'confidence' => $this->confidence,
        ];
    }

    public function withQuantity(float $quantity): self
    {
        return new self(
            name: $this->name,
            brand: $this->brand,
            presentation: $this->presentation,
            category: $this->category,
            quantity: $quantity,
            unit: $this->unit,
            confidence: $this->confidence,
        );
    }

    /**
     * Clave de identidad de producto usada para deduplicación dentro de una
     * misma captura: mismo nombre + marca + presentación (ver sección 74).
     * El matching contra el catálogo real vive en ProductService, no aquí.
     */
    public function matchKey(): string
    {
        return mb_strtolower(trim($this->name)).'|'
            .mb_strtolower(trim((string) $this->brand)).'|'
            .mb_strtolower(trim((string) $this->presentation));
    }

    /**
     * Clave por solo nombre, usada para atar la cantidad hablada (que rara
     * vez menciona marca o presentación) al producto que sí detectó la foto
     * en modo Foto + Voz (ver CombinedCaptureStrategy).
     */
    public function nameKey(): string
    {
        return mb_strtolower(trim($this->name));
    }
}
