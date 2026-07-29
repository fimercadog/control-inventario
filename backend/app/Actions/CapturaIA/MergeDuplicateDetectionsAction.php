<?php

namespace App\Actions\CapturaIA;

use App\DTO\AI\DetectedProductDTO;

/**
 * Si `products[]` trae varias entradas del mismo producto (mismo
 * nombre + marca + presentación), las funde en una sola sumando la
 * cantidad. Nunca deja que se creen registros o movimientos duplicados
 * por unidad física detectada (sección 74 del master spec).
 */
class MergeDuplicateDetectionsAction
{
    /**
     * @param DetectedProductDTO[] $detecciones
     * @return DetectedProductDTO[]
     */
    public function __invoke(array $detecciones): array
    {
        /** @var array<string, DetectedProductDTO> $porClave */
        $porClave = [];
        /** @var array<string, float[]> $confianzasPorClave */
        $confianzasPorClave = [];

        foreach ($detecciones as $deteccion) {
            $clave = $deteccion->matchKey();

            if (! isset($porClave[$clave])) {
                $porClave[$clave] = $deteccion;
                $confianzasPorClave[$clave] = [$deteccion->confidence];

                continue;
            }

            $porClave[$clave] = $porClave[$clave]->withQuantity(
                $porClave[$clave]->quantity + $deteccion->quantity
            );
            $confianzasPorClave[$clave][] = $deteccion->confidence;
        }

        // La confianza de la entrada fusionada es el promedio de las
        // confianzas individuales: ni se infla con la mejor detección
        // ni se castiga por completo con la peor.
        foreach ($porClave as $clave => $detectado) {
            $promedio = array_sum($confianzasPorClave[$clave]) / count($confianzasPorClave[$clave]);
            $porClave[$clave] = new DetectedProductDTO(
                name: $detectado->name,
                brand: $detectado->brand,
                presentation: $detectado->presentation,
                category: $detectado->category,
                quantity: $detectado->quantity,
                unit: $detectado->unit,
                confidence: round($promedio, 3),
            );
        }

        return array_values($porClave);
    }
}
