<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Auth\RefreshTokenServiceInterface;
use App\Exceptions\CannotDeactivateSelfException;
use App\Exceptions\LastCompanyAdminException;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\AssignRoleRequest;
use App\Http\Resources\User\UserResource;
use App\Http\Support\ApiResponse;
use App\Models\Role;
use App\Models\User;
use App\Services\Audit\AuditLogger;
use App\Services\Auth\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RC1 Fase 4 (docs/03_FUNCTIONAL_SPEC/Users.md), ampliado 2026-08-03 con
 * Módulo 6 (Invitaciones, ver `InvitationController`) y `asignarRol()`.
 * Alcance confirmado explícitamente por el propietario del proyecto: sin
 * `store()` propio aquí — la creación de cuentas sigue siendo exclusiva
 * de `InvitationController::aceptar()`; sin edición de campos de perfil
 * (nombre/email pertenecen a Perfil); sin ningún endpoint de eliminar.
 * Reasignación de rol y "empresa" del usuario permanecen dos decisiones
 * separadas y deliberadas: `asignarRol()` sí se construyó (Módulo 5 ya
 * está completo); mover un usuario de empresa sigue fuera de alcance a
 * propósito — no existe ningún precedente en esta arquitectura para
 * reasignar `empresa_id` sin invalidar el resto de las garantías de
 * aislamiento por empresa (audit logs, movimientos, etc. de ese usuario).
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
    ) {}

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
     *
     * Nota (2026-08-04, auditoría de campos editables): desde que
     * `UserPolicy::update()` exige `usuarios.editar` en el actor, la
     * guarda `esElUltimoConGestion()` ya no es alcanzable vía un tercero —
     * quien llama esta acción necesariamente conserva el permiso después
     * de desactivar a otro, así que nunca puede dejar a la empresa sin
     * nadie con gestión por esta ruta. Sigue siendo la defensa correcta
     * para la única ruta que sí podría dejarla sin nadie — la propia
     * cuenta —, pero esa ya la bloquea `CannotDeactivateSelfException`
     * antes de llegar aquí. Se conserva como defensa en profundidad, no
     * como código muerto a eliminar: si el modelo de autorización cambia
     * otra vez, esta guarda vuelve a ser la última línea de defensa real.
     * El riesgo real que queda abierto está en `asignarRol()`, que no
     * tiene guarda equivalente — ver informe de la auditoría.
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

    /**
     * Reemplaza el rol del usuario — este ERP modela "un usuario, un rol"
     * de punta a punta (UserResource ya expone un `role` singular, no una
     * lista), así que `syncRoles()` (nunca `assignRole()` acumulativo) es
     * la operación correcta aquí.
     */
    public function asignarRol(AssignRoleRequest $request, int $id): JsonResponse
    {
        $usuario = $this->resolverUsuarioDeLaEmpresa($id);

        $this->authorize('update', $usuario);

        $rol = Role::where('empresa_id', $usuario->empresa_id)->findOrFail($request->validated('role_id'));

        $rolAnterior = $usuario->getRoleNames()->first();
        $usuario->syncRoles([$rol]);

        $this->registrarAuditoria($request, $usuario, 'usuarios.asignar_rol', [
            'rol_anterior' => $rolAnterior,
            'rol_nuevo' => $rol->name,
        ]);

        return ApiResponse::success(
            new UserResource($usuario->fresh()->load('invitedBy')),
            'Rol asignado correctamente'
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
     * @param  array<string, mixed>  $valoresNuevos
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
