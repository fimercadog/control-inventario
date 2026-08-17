<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Support\ApiResponse;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

/**
 * Catálogo global de permisos, de solo lectura — para la UI de asignación
 * de permisos a un rol (Módulo 5, docs/security/ROLES_MATRIX.md sección
 * 7). Gateado por `roles.ver`: no tiene sentido exponer "qué permisos se
 * le pueden asignar a un rol" a alguien que ni siquiera puede ver roles.
 * Excluye a propósito el namespace `plataforma.*` — nunca asignable a un
 * rol de empresa (sección 7, punto 3), así que ni se ofrece en esta lista.
 */
class PermissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $permisos = Permission::query()
            ->where('guard_name', 'api')
            ->where('name', 'not like', 'plataforma.%')
            ->orderBy('name')
            ->pluck('name');

        return ApiResponse::success($permisos->values());
    }
}
