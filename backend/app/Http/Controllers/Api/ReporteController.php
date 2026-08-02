<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Support\ApiResponse;
use App\Services\ReporteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Reportes (2026-08-02). Sin `ReportePolicy` a propósito — "Reportes" no
 * es un recurso Eloquent (no hay `Reporte` Model, es una vista computada
 * sobre 5 modelos distintos), así que no hay una clase de modelo natural
 * a la que atar una Policy. `$this->authorize('reportes.ver')` sin un
 * segundo argumento resuelve igual de bien: Spatie registra un
 * `Gate::before()` global (`PermissionRegistrar::registerPermissions()`)
 * que intercepta cualquier nombre de ability y lo resuelve contra
 * `$user->checkPermissionTo()` — el mismo mecanismo que usa cada
 * `$user->can('recurso.accion')` dentro de las demás Policies, solo que
 * invocado directo en vez de a través de una clase intermedia.
 */
class ReporteController extends Controller
{
    public function __construct(
        private readonly ReporteService $reportes,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('reportes.ver');

        return ApiResponse::success(
            $this->reportes->generarResumen($request->query('desde'), $request->query('hasta'))
        );
    }
}
