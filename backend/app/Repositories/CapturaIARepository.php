<?php

namespace App\Repositories;

use App\DTO\AI\AIExtractionResultDTO;
use App\DTO\CapturaIA\AppliedDetectionResultDTO;
use App\DTO\CapturaIA\CaptureInputDTO;
use App\Enums\CapturaIA\EstadoCaptura;
use App\Enums\CapturaIA\TipoCaptura;
use App\Exceptions\IdempotencyConflictException;
use App\Models\CapturaIA;
use Illuminate\Database\QueryException;

/**
 * Persiste la captura y su detalle, y hace el mapeo entre el vocabulario
 * en inglés del contrato de IA (products.name/brand/...) y las columnas en
 * español del resto del sistema (sección 74 del master spec).
 */
class CapturaIARepository
{
    /**
     * @param AppliedDetectionResultDTO[] $aplicados
     *
     * @throws IdempotencyConflictException si otra request con la misma
     *         idempotency_key ganó la carrera e insertó primero.
     */
    public function guardar(CaptureInputDTO $input, AIExtractionResultDTO $resultadoIA, array $aplicados): CapturaIA
    {
        $extraccion = $resultadoIA->data;
        [$archivoPath, $archivoSecundarioPath] = $this->resolverArchivos($input);

        try {
            $captura = CapturaIA::create([
                'uuid' => $input->uuid,
                'empresa_id' => $input->empresaId,
                'usuario_id' => $input->usuarioId,
                'idempotency_key' => $input->idempotencyKey,
                'tipo' => $input->tipo,
                'archivo_path' => $archivoPath,
                'archivo_secundario_path' => $archivoSecundarioPath,
                'transcripcion' => $extraccion->transcript,
                'respuesta_ia_json' => $extraccion->toArray(),
                'proveedor_ia' => $resultadoIA->provider,
                'tiempo_procesamiento_ms' => $resultadoIA->processingTimeMs,
                'movimiento_tipo' => $extraccion->movement,
                'confianza_promedio' => $this->confianzaPromedio($aplicados),
                'estado' => $this->estadoGeneral($aplicados),
            ]);
        } catch (QueryException $e) {
            // Solo puede ser el índice único (empresa_id, idempotency_key):
            // dos requests con la misma clave llegaron a la vez. El llamador
            // (CapturaIAService) hace rollback de todo este intento y
            // recupera la captura que sí ganó la carrera.
            if ($input->idempotencyKey !== null) {
                throw new IdempotencyConflictException($input->empresaId, $input->idempotencyKey);
            }

            throw $e;
        }

        foreach ($aplicados as $aplicado) {
            $captura->detalles()->create([
                'producto_id' => $aplicado->producto?->id,
                'movimiento_id' => $aplicado->movimiento?->id,
                'nombre_detectado' => $aplicado->detectado->name,
                'marca_detectado' => $aplicado->detectado->brand,
                'categoria_detectado' => $aplicado->detectado->category,
                'presentacion_detectado' => $aplicado->detectado->presentation,
                'unidad_detectado' => $aplicado->detectado->unit,
                'cantidad_detectada' => $aplicado->detectado->quantity,
                'confianza' => $aplicado->detectado->confidence,
                'es_producto_nuevo' => $aplicado->esProductoNuevo,
                'estado' => $aplicado->estado,
            ]);
        }

        return $captura->fresh('detalles');
    }

    /**
     * @return array{0: ?string, 1: ?string}
     */
    private function resolverArchivos(CaptureInputDTO $input): array
    {
        return match ($input->tipo) {
            TipoCaptura::Foto => [$input->imagenPath, null],
            TipoCaptura::Voz => [$input->audioPath, null],
            TipoCaptura::FotoVoz => [$input->imagenPath, $input->audioPath],
        };
    }

    /**
     * @param AppliedDetectionResultDTO[] $aplicados
     */
    private function confianzaPromedio(array $aplicados): float
    {
        if ($aplicados === []) {
            return 0.0;
        }

        $confianzas = array_map(fn (AppliedDetectionResultDTO $a) => $a->detectado->confidence, $aplicados);

        return round(array_sum($confianzas) / count($confianzas), 3);
    }

    /**
     * @param AppliedDetectionResultDTO[] $aplicados
     */
    private function estadoGeneral(array $aplicados): EstadoCaptura
    {
        return EstadoCaptura::agregarDesde(array_map(fn (AppliedDetectionResultDTO $a) => $a->estado, $aplicados));
    }
}
