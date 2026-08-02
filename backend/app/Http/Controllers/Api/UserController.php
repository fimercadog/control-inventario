<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Auth\RefreshTokenServiceInterface;
use App\Exceptions\CannotDeactivateSelfException;
use App\Exceptions\LastCompanyAdminException;
use App\Http\Controllers\Controller;
use App\Http\Resources\User\UserResource;
use App\Http\Support\ApiResponse;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use App\Services\Auth\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md). Alcance confirmado
 * explícitamente por el propietario del proyecto antes de esta unidad de
 * trabajo: Listar/Ver/Activar/Desactivar únicamente. Sin `store()` (la
 * creación es Módulo 6 — Invitaciones, sin construir); sin edición de
 * campos de perfil (nombre/email pertenecen a Perfil); sin reasignación de
 * rol (Módulo 5 — Roles, sin construir); sin ningún endpoint de eliminar.
 *
 * `User` no tiene `TenantScope` automático (a diferencia de Producto/
 * Categoria/Movimiento) — cada método de este controller filtra
 * manualmente por `empresa_id` antes de resolver un usuario por id, así
 * que un id de otra empresa siempre resulta en `ModelNotFoundException`
 * (404), nunca en un 403 que confirme su existencia.
 */
class UserController extends Controller
{
    public function __construct(
        private readonly AuditLogger $auditoria,
        private readonly RefreshTokenServiceInterface $refreshTokens,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->with('invitedBy')
            ->where('empresa_id', app(TenantContext::class)->empresaId());

        if ($busqueda = $request->query('busqueda')) {
            $query->where(function ($q) use ($busqueda) {
                $q->where('name', 'like', "%{$busqueda}%")
                    ->orWhere('email', 'like', "%{$busqueda}%");
            });
        }

        if ($rol = $request->query('rol')) {
            $query->whereHas('roles', fn ($q) => $q->where('name', $rol));
        }

        // Por defecto solo usuarios activos — inactivos visibles únicamente
        // vía filtro explícito (GLOBAL UI STANDARD, mismo criterio que el
        // resto de los módulos).
        if ($request->query('estado') !== 'todos') {
            $query->where('is_active', $request->query('estado', 'activo') === 'activo');
        }

        $usuarios = $query->orderBy('name')->paginate(100);

        return ApiResponse::success([
            'items' => UserResource::collection($usuarios)->resolve(),
            'meta' => [
                'current_page' => $usuarios->currentPage(),
                'per_page' => $usuarios->perPage(),
                'total' => $usuarios->total(),
                'last_page' => $usuarios->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $usuario = $this->resolverUsuarioDeLaEmpresa($id)->load('invitedBy');

        $this->authorize('view', $usuario);

        return ApiResponse::success(new UserResource($usuario));
    }

    public function activar(Request $request, int $id): JsonResponse
    {
        $usuario = $this->resolverUsuarioDeLaEmpresa($id);

        $this->authorize('update', $usuario);

        $usuario->update(['is_active' => true]);

        $this->registrarAuditoria($request, $usuario, 'usuarios.activar', ['is_active' => true]);

        return ApiResponse::success(
            new UserResource($usuario->fresh()->load('invitedBy')),
            'Usuario activado correctamente'
        );
    }

    /**
     * Dos guardas de negocio, en este orden, ninguna relajable (Users.md,
     * Decisiones 2 y 3): nunca la propia cuenta, nunca el último usuario
     * activo de la empresa con `usuarios.editar`. Además revoca todas las
     * `auth_sessions` activas del usuario afectado — mismo mecanismo ya
     * usado por reset de contraseña.
     */
    public function desactivar(Request $request, int $id): JsonResponse
    {
        $usuario = $this->resolverUsuarioDeLaEmpresa($id);

        $this->authorize('update', $usuario);

        if ($usuario->id === $request->user()->id) {
            throw new CannotDeactivateSelfException('No puedes desactivar tu propia cuenta.');
        }

        if ($usuario->hasPermissionTo('usuarios.editar') && $this->esElUltimoConGestion($usuario)) {
            throw new LastCompanyAdminException(
                'No puedes desactivar al último usuario con permiso de gestión de esta empresa.'
            );
        }

        $usuario->update(['is_active' => false]);
        $this->refreshTokens->revokeAllForUser($usuario->id);

        $this->registrarAuditoria($request, $usuario, 'usuarios.desactivar', ['is_active' => false]);

        return ApiResponse::success(
            new UserResource($usuario->fresh()->load('invitedBy')),
            'Usuario desactivado correctamente'
        );
    }

    private function resolverUsuarioDeLaEmpresa(int $id): User
    {
        return User::where('empresa_id', app(TenantContext::class)->empresaId())
            ->findOrFail($id);
    }

    private function esElUltimoConGestion(User $usuario): bool
    {
        $hayOtroConGestion = User::where('empresa_id', $usuario->empresa_id)
            ->where('is_active', true)
            ->where('id', '!=', $usuario->id)
            ->get()
            ->contains(fn (User $otro) => $otro->hasPermissionTo('usuarios.editar'));

        return ! $hayOtroConGestion;
    }

    /**
     * @param array<string, mixed> $valoresNuevos
     */
    private function registrarAuditoria(Request $request, User $usuario, string $accion, array $valoresNuevos): void
    {
        $this->auditoria->registrarAccionManual(
            empresaId: $usuario->empresa_id,
            usuarioId: $request->user()->id,
            modulo: 'usuarios',
            accion: $accion,
            auditableType: User::class,
            auditableId: $usuario->id,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
