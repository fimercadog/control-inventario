<?php

use App\Exceptions\AIProviderException;
use App\Exceptions\Auth\AccountNotAvailableException;
use App\Exceptions\Auth\InvalidCredentialsException;
use App\Exceptions\Auth\InvalidRefreshTokenException;
use App\Exceptions\CannotDeactivateSelfException;
use App\Exceptions\CapturaIAEstadoInvalidoException;
use App\Exceptions\ContingenciaConflictoException;
use App\Exceptions\IdempotencyConflictException;
use App\Http\Resources\Producto\ProductoResource;
use App\Exceptions\LastCompanyAdminException;
use App\Exceptions\RoleHasAssignedUsersException;
use App\Exceptions\StockInsuficienteException;
use App\Http\Middleware\IdentifyEmpresa;
use App\Http\Support\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Tymon\JWTAuth\Exceptions\JWTException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // API-only: no existe una ruta web 'login'. Sin esto, Laravel
        // intenta route('login') al construir la respuesta 401 para
        // cualquier request que no declare Accept: application/json,
        // lo que lanza RouteNotFoundException y termina en un 500 crudo
        // en vez del 401 limpio (contradice la sección "no raw exceptions").
        $middleware->redirectGuestsTo(fn () => null);

        // Módulo 2 — Company Isolation. Toda ruta de negocio debe usar
        // ['auth:api', 'empresa'] junto (nunca 'auth:api' solo) — ver
        // routes/api.php. ADR-019: 'empresa' ya no fija ningún contexto
        // ambiental (eliminado) — solo fija el team id de Spatie a partir
        // del usuario ya autenticado por 'auth:api' (ver IdentifyEmpresa).
        // El aislamiento por empresa en sí corre explícito por request, vía
        // `FiltersByEmpresa` en cada Controller/Repository.
        $middleware->alias(['empresa' => IdentifyEmpresa::class]);

        // IdentifyEmpresa fija el team id de Spatie y limpia la caché de
        // permisos (`forgetCachedPermissions()`, ver su propio docblock) —
        // eso DEBE ocurrir antes de cualquier `$this->authorize()`/Policy
        // en el Controller, así que se fuerza a correr apenas después de
        // Authenticate, lo antes posible en el pipeline.
        $middleware->appendToPriorityList(after: AuthenticatesRequests::class, append: IdentifyEmpresa::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Formato único de error para toda la API (sección 41 del master spec).
        $exceptions->render(function (ValidationException $e, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Error de validación', $e->errors(), 422);
            }
        });

        $exceptions->render(function (AIProviderException $e, $request) {
            if ($request->is('api/*')) {
                report($e);

                return ApiResponse::error(
                    'No pudimos analizar tu captura. Intenta de nuevo en unos minutos.',
                    [],
                    502
                );
            }
        });

        $exceptions->render(function (StockInsuficienteException|CapturaIAEstadoInvalidoException|IdempotencyConflictException|CannotDeactivateSelfException|LastCompanyAdminException|RoleHasAssignedUsersException $e, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error($e->getMessage(), [], 409);
            }
        });

        // Modo Contingencia (sección 11 del Work Order) — a diferencia del
        // resto de los 409 de arriba, el frontend necesita el estado real
        // del producto en el servidor para poder mostrarle al usuario qué
        // cambió, no solo un mensaje.
        $exceptions->render(function (ContingenciaConflictoException $e, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error($e->getMessage(), [
                    'producto_servidor' => new ProductoResource($e->productoServidor),
                    'base_version_cliente' => $e->baseVersionCliente,
                ], 409);
            }
        });

        $exceptions->render(function (ModelNotFoundException $e, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('No encontramos el recurso solicitado.', [], 404);
            }
        });

        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Debes iniciar sesión para continuar.', [], 401);
            }
        });

        $exceptions->render(function (AuthorizationException $e, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('No tienes permiso para realizar esta acción.', [], 403);
            }
        });

        // Módulo Auth (Fase 5). Credenciales inválidas: nunca se distingue
        // "el correo no existe" de "la contraseña es incorrecta" (protección
        // contra enumeración de usuarios).
        $exceptions->render(function (InvalidCredentialsException $e, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Correo o contraseña incorrectos.', [], 401);
            }
        });

        $exceptions->render(function (AccountNotAvailableException $e, $request) {
            if ($request->is('api/*')) {
                $mensaje = $e->getMessage() === 'unverified'
                    ? 'Debes verificar tu correo antes de iniciar sesión.'
                    : 'Esta cuenta está desactivada. Contacta a un administrador.';

                return ApiResponse::error($mensaje, [], 403);
            }
        });

        // Refresh token inválido, revocado o expirado, y cualquier fallo al
        // decodificar el JWT de acceso (expirado, manipulado, mal formado):
        // siempre el mismo mensaje genérico y neutro, nunca el detalle interno.
        $exceptions->render(function (InvalidRefreshTokenException|JWTException $e, $request) {
            if ($request->is('api/*')) {
                return ApiResponse::error('Tu sesión expiró. Inicia sesión de nuevo.', [], 401);
            }
        });

        // Cualquier excepción HTTP de Symfony que no tenga un renderer más
        // específico arriba (404 de ruta no encontrada, 405, etc.).
        $exceptions->render(function (HttpExceptionInterface $e, $request) {
            if ($request->is('api/*')) {
                $status = $e->getStatusCode();
                $message = $status === 404
                    ? 'No encontramos el recurso solicitado.'
                    : 'No pudimos procesar la solicitud.';

                return ApiResponse::error($message, [], $status);
            }
        });

        // Red de seguridad final: ninguna excepción no anticipada debe
        // devolver nunca un stack trace o un JSON crudo al cliente, sin
        // importar el valor de APP_DEBUG (sección "Revisión RC1", punto 5:
        // "No raw exceptions. No stack traces. No JSON errors.").
        $exceptions->render(function (Throwable $e, $request) {
            if ($request->is('api/*')) {
                report($e);

                return ApiResponse::error(
                    'Ocurrió un error inesperado. Intenta de nuevo en unos segundos.',
                    [],
                    500
                );
            }
        });
    })->create();
