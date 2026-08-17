<?php

namespace App\Http\Support;

use Illuminate\Http\JsonResponse;

/**
 * Envoltorio estándar de respuesta de toda la API (sección 41 del master
 * spec). No es exclusivo de Captura IA: cualquier Controller futuro debe
 * usar este mismo formato en vez de construir el JSON a mano.
 */
class ApiResponse
{
    public static function success(mixed $data = null, string $message = 'Operación realizada correctamente', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * @param array<int|string, mixed> $errors
     */
    public static function error(string $message, array $errors = [], int $status = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ], $status);
    }
}
