<?php

namespace App\Services\CapturaIA\Strategies;

use App\Contracts\AI\AIProviderInterface;
use App\Contracts\CapturaIA\CaptureStrategyInterface;
use App\DTO\AI\AIExtractionResultDTO;
use App\DTO\AI\DetectedProductDTO;
use App\DTO\AI\StructuredExtractionDTO;
use App\DTO\CapturaIA\CaptureInputDTO;
use App\Enums\CapturaIA\TipoCaptura;
use InvalidArgumentException;

/**
 * La foto aporta identidad de producto (nombre/marca/presentación/categoría);
 * la voz aporta cantidad y movimiento. Ejemplo del brief original: foto =
 * "Caja Dog Chow", audio = "Entraron cinco" → producto Dog Chow, cantidad 5,
 * movimiento entrada.
 */
class CombinedCaptureStrategy implements CaptureStrategyInterface
{
    public function __construct(
        private readonly AIProviderInterface $ai,
    ) {
    }

    public function soporta(TipoCaptura $tipo): bool
    {
        return $tipo === TipoCaptura::FotoVoz;
    }

    public function capturar(CaptureInputDTO $input): AIExtractionResultDTO
    {
        if ($input->imagenPath === null || $input->audioPath === null) {
            throw new InvalidArgumentException('El modo Foto + Voz requiere imagenPath y audioPath.');
        }

        $resultadoFoto = $this->ai->analyzeImage($input->imagenPath);

        $inicio = microtime(true);
        $transcripcion = $this->ai->transcribeAudio($input->audioPath);
        $tiempoTranscripcion = (int) round((microtime(true) - $inicio) * 1000);

        $nombresDetectados = array_map(fn (DetectedProductDTO $p) => $p->name, $resultadoFoto->data->products);
        $resultadoVoz = $this->ai->extractStructured($transcripcion, $nombresDetectados);

        $extraccionFusionada = new StructuredExtractionDTO(
            products: $this->fusionar($resultadoFoto->data->products, $resultadoVoz->data->products),
            // La voz determina la intención de movimiento; la foto sola no
            // trae un verbo del que inferirlo.
            movement: $resultadoVoz->data->movement,
            transcript: $transcripcion,
        );

        return new AIExtractionResultDTO(
            data: $extraccionFusionada,
            provider: $this->ai->name(),
            processingTimeMs: $resultadoFoto->processingTimeMs + $tiempoTranscripcion + $resultadoVoz->processingTimeMs,
        );
    }

    /**
     * @param DetectedProductDTO[] $productosFoto
     * @param DetectedProductDTO[] $productosVoz
     * @return DetectedProductDTO[]
     */
    private function fusionar(array $productosFoto, array $productosVoz): array
    {
        // Se ata por nombre, no por matchKey() completo: la voz casi nunca
        // menciona marca o presentación ("entraron cinco" / "cinco de Dog
        // Chow"), así que exigir que coincidan también dejaría sin fusionar
        // el caso normal.
        $porClave = [];
        foreach ($productosFoto as $producto) {
            $porClave[$producto->nameKey()] = $producto;
        }

        foreach ($productosVoz as $productoVoz) {
            $clave = $productoVoz->nameKey();

            if (! isset($porClave[$clave])) {
                // La voz mencionó un producto que la foto no detectó.
                $porClave[$clave] = $productoVoz;

                continue;
            }

            $productoFoto = $porClave[$clave];
            $porClave[$clave] = new DetectedProductDTO(
                name: $productoFoto->name,
                brand: $productoFoto->brand ?? $productoVoz->brand,
                presentation: $productoFoto->presentation ?? $productoVoz->presentation,
                category: $productoFoto->category ?? $productoVoz->category,
                // La cantidad hablada manda sobre la cantidad estimada por foto.
                quantity: $productoVoz->quantity,
                unit: $productoFoto->unit ?? $productoVoz->unit,
                confidence: min($productoFoto->confidence, $productoVoz->confidence),
            );
        }

        return array_values($porClave);
    }
}
