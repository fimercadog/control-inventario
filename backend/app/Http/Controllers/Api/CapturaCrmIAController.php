<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Controller;
use App\Http\Requests\CapturaIA\StoreCapturaCrmRequest;
use App\Http\Resources\CapturaIA\CapturaCrmIAResource;
use App\Http\Support\ApiResponse;
use App\Models\CapturaCrmIA;
use App\Services\AI\CrmCaptureExtractionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CapturaCrmIAController extends Controller
{
    use FiltersByEmpresa;
    public function __construct(private readonly CrmCaptureExtractionService $extractor) {}

    public function store(StoreCapturaCrmRequest $request): JsonResponse
    {
        $this->autorizarEntidad($request->string('entidad')->toString(), $request);
        $propuesta = $this->extractor->extract($request->string('entidad')->toString(), $request->string('contenido')->toString());
        $captura = CapturaCrmIA::create(['empresa_id' => $request->user()->empresa_id, 'usuario_id' => $request->user()->id, 'entidad' => $request->string('entidad')->toString(), 'contenido_original' => $request->string('contenido')->toString(), 'propuesta_ia' => $propuesta, 'confianza' => $propuesta['confianza'] ?? 0]);
        return ApiResponse::success(new CapturaCrmIAResource($captura), 'Propuesta CRM creada; revísala antes de registrar la información.', 201);
    }

    public function index(Request $request): JsonResponse
    {
        $capturas = $this->paraEmpresaActual(CapturaCrmIA::query())->latest()->limit(20)->get();
        return ApiResponse::success(CapturaCrmIAResource::collection($capturas));
    }

    private function autorizarEntidad(string $entidad, Request $request): void
    {
        $permission = match ($entidad) { 'contacto' => 'contactos.crear', 'oportunidad' => 'oportunidades.crear', 'actividad' => 'actividades.crear' };
        abort_unless($request->user()->can($permission), 403);
    }
}
