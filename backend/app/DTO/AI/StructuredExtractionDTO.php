<?php

namespace App\DTO\AI;

/**
 * Forma provider-agnostic del contrato { "products": [...], "movement": "..." }
 * (sección 74 del master spec). Cualquier AIProviderInterface (OpenAI,
 * Claude, Gemini, Ollama, OpenRouter) devuelve esta misma estructura;
 * ninguna Strategy ni Service conoce el formato crudo específico de un
 * proveedor.
 */
final readonly class StructuredExtractionDTO
{
    /**
     * @param DetectedProductDTO[] $products
     */
    public function __construct(
        public array $products,
        public string $movement,
        public ?string $transcript = null,
    ) {
    }

    public function withTranscript(?string $transcript): self
    {
        return new self($this->products, $this->movement, $transcript);
    }

    /**
     * Serializa de vuelta al contrato crudo { "products": [...], "movement": "..." }
     * para auditoría (columna `capturas_ia.respuesta_ia_json`).
     *
     * @return array{products: array<int, array<string, mixed>>, movement: string}
     */
    public function toArray(): array
    {
        return [
            'products' => array_map(fn (DetectedProductDTO $p) => $p->toArray(), $this->products),
            'movement' => $this->movement,
        ];
    }

    /**
     * @param array{products?: array<int, array<string, mixed>>, movement?: string} $data
     */
    public static function fromArray(array $data): self
    {
        // El contrato exige que "products" sea siempre un arreglo. Si el proveedor
        // devolviera un objeto suelto, se envuelve aquí en un arreglo de un elemento.
        $products = $data['products'] ?? [];
        if (self::isAssociative($products)) {
            $products = [$products];
        }

        return new self(
            products: array_map(
                fn (array $product) => DetectedProductDTO::fromArray($product),
                array_values($products)
            ),
            movement: $data['movement'] ?? 'entrada',
        );
    }

    /**
     * @param array<mixed> $value
     */
    private static function isAssociative(array $value): bool
    {
        return $value !== [] && array_keys($value) !== range(0, count($value) - 1);
    }
}
