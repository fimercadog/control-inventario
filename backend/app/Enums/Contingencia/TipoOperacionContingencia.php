<?php

namespace App\Enums\Contingencia;

/**
 * Modo Contingencia (docs/03_FUNCTIONAL_SPEC/ProductContingencyMode.md).
 * Alcance deliberadamente acotado a Productos — sección 1 del Work
 * Order ("El Modo Contingencia permite exclusivamente: Crear Productos,
 * Actualizar Productos"). No agregar casos aquí sin una decisión
 * explícita de producto que amplíe el alcance.
 */
enum TipoOperacionContingencia: string
{
    case Crear = 'crear';
    case Actualizar = 'actualizar';
}
