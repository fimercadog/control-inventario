<?php

namespace App\Http\Controllers\Api;

use App\DTO\CapturaIA\CaptureInputDTO;
use App\Enums\CapturaIA\TipoCaptura;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Controller;
use App\Http\Requests\CapturaIA\StoreFotoRequest;
use App\Http\Requests\CapturaIA\StoreFotoVozRequest;
use App\Http\Requests\CapturaIA\StoreVozRequest;
use App\Http\Requests\CapturaIA\UpdateDetalleRequest;
use App\Http\Resources\CapturaIA\CapturaIADetalleResource;
use App\Http\Resources\CapturaIA\CapturaIAResource;
use App\Http\Support\ApiResponse;
use App\Models\CapturaIA;
use App\Services\CapturaIA\CapturaArchivoStorage;
use App\Services\CapturaIA\CapturaIAService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Todos los endpoints de este módulo viven bajo /api/v1/captura-ia — nunca
 * se expone un endpoint por proveedor de IA (sección 74 del master spec,
 * punto 7). El Controller solo valida, guarda el archivo original y
 * delega en CapturaIAService; no conoce OpenAI ni ningún proveedor.
 *
 * Módulo 2 — Company Isolation (docs/04_ARCHITECTURE.md): `empresa_id`
 * SIEMPRE viene del usuario autenticado, nunca del request (body/query) —
 * ver `empresaIdOrFail()`. ADR-019: no hay Global Scope automático;
 * `FiltersByEmpresa` filtra `CapturaIA::query()` explícitamente en
 * `index()` y resuelve `{captura}` (route key `uuid`) vía
 * `resolverParaEmpresaActual()` en el resto — los `authorize()` de abajo
 * son la segunda capa de defensa explícita, por si ese filtro se omite en
 * algún método nuevo.
 */
class CapturaIAController extends Controller
{
    use FiltersByEmpresa;

    public function __construct(
        private readonly CapturaArchivoStorage $archivos,
        private readonly CapturaIAService $servicio,
    ) {
    }

    public function foto(StoreFotoRequest $request): JsonResponse
    {
        $this->authorize('create', CapturaIA::class);

        $empresaId = $this->empresaIdOrFail($request);

        if ($existente = $this->capturaExistentePorIdempotencyKey($request, $empresaId)) {
            return $this->respuestaExistente($existente);
        }

        $uuid = (string) Str::uuid();
        $rutaImagen = $this->archivos->guardarImagen($request->file('imagen'), $empresaId, $uuid);

        return $this->procesarYResponder($request, new CaptureInputDTO(
            tipo: TipoCaptura::Foto,
            empresaId: $empresaId,
            usuarioId: $request->user()?->id,
            imagenPath: $rutaImagen,
            uuid: $uuid,
            idempotencyKey: $this->idempotencyKey($request),
        ));
    }

    public function voz(StoreVozRequest $request): JsonResponse
    {
        $this->authorize('create', CapturaIA::class);

        $empresaId = $this->empresaIdOrFail($request);

        if ($existente = $this->capturaExistentePorIdempotencyKey($request, $empresaId)) {
            return $this->respuestaExistente($existente);
        }

        $uuid = (string) Str::uuid();
        $rutaAudio = $this->archivos->guardarAudio($request->file('audio'), $empresaId, $uuid);

        return $this->procesarYResponder($request, new CaptureInputDTO(
            tipo: TipoCaptura::Voz,
            empresaId: $empresaId,
            usuarioId: $request->user()?->id,
            audioPath: $rutaAudio,
            uuid: $uuid,
            idempotencyKey: $this->idempotencyKey($request),
        ));
    }

    public function fotoVoz(StoreFotoVozRequest $request): JsonResponse
    {
        $this->authorize('create', CapturaIA::class);

        $empresaId = $this->empresaIdOrFail($request);

        if ($existente = $this->capturaExistentePorIdempotencyKey($request, $empresaId)) {
            return $this->respuestaExistente($existente);
        }

        $uuid = (string) Str::uuid();
        $rutaImagen = $this->archivos->guardarImagen($request->file('imagen'), $empresaId, $uuid);
        $rutaAudio = $this->archivos->guardarAudio($request->file('audio'), $empresaId, $uuid);

        return $this->procesarYResponder($request, new CaptureInputDTO(
            tipo: TipoCaptura::FotoVoz,
            empresaId: $empresaId,
            usuarioId: $request->user()?->id,
            imagenPath: $rutaImagen,
            audioPath: $rutaAudio,
            uuid: $uuid,
            idempotencyKey: $this->idempotencyKey($request),
        ));
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', CapturaIA::class);

        $capturas = $this->paraEmpresaActual(CapturaIA::query())
            ->with('detalles')
            ->latest()
            ->paginate(20);

        return ApiResponse::success([
            'items' => CapturaIAResource::collection($capturas)->resolve(),
            'meta' => [
                'current_page' => $capturas->currentPage(),
                'per_page' => $capturas->perPage(),
                'total' => $capturas->total(),
                'last_page' => $capturas->lastPage(),
            ],
        ]);
    }

    public function show(Request $request, string $captura): JsonResponse
    {
        $captura = $this->resolverParaEmpresaActual(CapturaIA::class, $captura, 'uuid');
        $this->authorize('view', $captura);

        return ApiResponse::success(new CapturaIAResource($captura->load('detalles')));
    }

    public function confirmar(Request $request, string $captura): JsonResponse
    {
        $captura = $this->resolverParaEmpresaActual(CapturaIA::class, $captura, 'uuid');
        $this->authorize('update', $captura);

        $captura = $this->servicio->confirmar($captura, $request->user()?->id);

        return ApiResponse::success(new CapturaIAResource($captura), 'Captura confirmada correctamente');
    }

    public function descartar(Request $request, string $captura): JsonResponse
    {
        $captura = $this->resolverParaEmpresaActual(CapturaIA::class, $captura, 'uuid');
        $this->authorize('update', $captura);

        $captura = $this->servicio->descartar($captura);

        return ApiResponse::success(new CapturaIAResource($captura), 'Captura descartada correctamente');
    }

    public function actualizarDetalle(UpdateDetalleRequest $request, string $captura, int $detalleId): JsonResponse
    {
        $captura = $this->resolverParaEmpresaActual(CapturaIA::class, $captura, 'uuid');
        $this->authorize('review', $captura);

        $detalle = $captura->detalles()->findOrFail($detalleId);
        $detalle = $this->servicio->corregirDetalle($detalle, $request->validated());

        return ApiResponse::success(new CapturaIADetalleResource($detalle), 'Detalle corregido correctamente');
    }

    private function procesarYResponder(Request $request, CaptureInputDTO $input): JsonResponse
    {
        $captura = $this->servicio->procesar($input, $request->ip(), $request->userAgent());

        return ApiResponse::success(
            new CapturaIAResource($captura->load('detalles')),
            'Captura procesada correctamente',
            201,
        );
    }

    private function idempotencyKey(Request $request): ?string
    {
        return $request->header('Idempotency-Key');
    }

    /**
     * empresa_id SIEMPRE del usuario autenticado — nunca del body ni del
     * query string (Módulo 2, "no confiar en el cliente"). Un Platform
     * Super Admin no tiene empresa propia y no puede capturar inventario.
     *
     * @throws AuthorizationException
     */
    private function empresaIdOrFail(Request $request): int
    {
        $empresaId = $request->user()->empresa_id;

        if ($empresaId === null) {
            throw new AuthorizationException('Esta acción requiere pertenecer a una empresa.');
        }

        return $empresaId;
    }

    /**
     * Chequeo temprano, ANTES de guardar el archivo original: si esta
     * Idempotency-Key ya se procesó, ni siquiera vale la pena escribir una
     * subida duplicada al storage (sección 74, punto 4).
     */
    private function capturaExistentePorIdempotencyKey(Request $request, int $empresaId): ?CapturaIA
    {
        $key = $this->idempotencyKey($request);

        return $key === null ? null : $this->servicio->buscarPorIdempotencyKey($empresaId, $key);
    }

    private function respuestaExistente(CapturaIA $captura): JsonResponse
    {
        return ApiResponse::success(
            new CapturaIAResource($captura->load('detalles')),
            'Captura ya procesada anteriormente (idempotency key repetida)',
            200,
        );
    }
}
