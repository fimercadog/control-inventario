<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\FiltersByEmpresa;
use App\Http\Controllers\Controller;
use App\Http\Support\ApiResponse;
use App\Models\Actividad;
use App\Models\Automatizacion;
use App\Models\Cliente;
use App\Models\Contacto;
use App\Models\EtapaOportunidad;
use App\Models\NotificacionCrm;
use App\Models\Oportunidad;
use App\Models\User;
use App\Services\CrmAutomationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CrmController extends Controller
{
    use FiltersByEmpresa;

    public function __construct(private readonly CrmAutomationService $automatizaciones) {}

    public function contactos(Request $request): JsonResponse
    {
        return ApiResponse::success($this->paraEmpresaActual(Contacto::query())->with(['cliente', 'responsable'])->when($request->query('busqueda'), fn ($q, $v) => $q->where(fn ($q) => $q->where('nombre', 'like', "%$v%")->orWhere('email', 'like', "%$v%")))->latest()->paginate($request->integer('per_page', 20)));
    }

    public function crearContacto(Request $request): JsonResponse
    {
        $data = $request->validate(['nombre' => ['required', 'string', 'max:150'], 'apellido' => ['nullable', 'string', 'max:150'], 'email' => ['nullable', 'email'], 'telefono' => ['nullable', 'string', 'max:50'], 'cargo' => ['nullable', 'string', 'max:100'], 'origen' => ['nullable', 'string', 'max:100'], 'notas' => ['nullable', 'string'], 'cliente_id' => ['nullable', 'integer'], 'responsable_id' => ['nullable', 'integer']]);
        $this->validarRelaciones($data, ['cliente_id' => Cliente::class, 'responsable_id' => User::class]);
        $contacto = Contacto::create([...$data, 'empresa_id' => $request->user()->empresa_id, 'estado' => 'prospecto']);
        return ApiResponse::success($contacto->load(['cliente', 'responsable']), 'Contacto creado correctamente', 201);
    }

    public function actualizarContacto(Request $request, int $contacto): JsonResponse
    {
        $model = $this->resolverParaEmpresaActual(Contacto::class, $contacto);
        $data = $request->validate(['nombre' => ['sometimes', 'string', 'max:150'], 'apellido' => ['nullable', 'string', 'max:150'], 'email' => ['nullable', 'email'], 'telefono' => ['nullable', 'string', 'max:50'], 'cargo' => ['nullable', 'string', 'max:100'], 'origen' => ['nullable', 'string', 'max:100'], 'notas' => ['nullable', 'string'], 'cliente_id' => ['nullable', 'integer'], 'responsable_id' => ['nullable', 'integer'], 'estado' => ['sometimes', 'in:prospecto,cliente,inactivo']]);
        $this->validarRelaciones($data, ['cliente_id' => Cliente::class, 'responsable_id' => User::class]);
        $model->update($data);
        return ApiResponse::success($model->fresh()->load(['cliente', 'responsable']), 'Contacto actualizado correctamente');
    }

    public function convertirContacto(Request $request, int $contacto): JsonResponse
    {
        $contacto = $this->resolverParaEmpresaActual(Contacto::class, $contacto);
        if (!$contacto->cliente_id) {
            $cliente = Cliente::create(['empresa_id' => $contacto->empresa_id, 'nombre' => trim($contacto->nombre.' '.$contacto->apellido), 'contacto' => trim($contacto->nombre.' '.$contacto->apellido), 'email' => $contacto->email, 'telefono' => $contacto->telefono, 'estado' => 'activo']);
            $contacto->cliente_id = $cliente->id;
        }
        $contacto->forceFill(['estado' => 'cliente', 'convertido_at' => now()])->save();
        return ApiResponse::success($contacto->fresh()->load('cliente'), 'Prospecto convertido correctamente');
    }

    public function etapas(Request $request): JsonResponse { return ApiResponse::success($this->paraEmpresaActual(EtapaOportunidad::query())->orderBy('orden')->get()); }
    public function crearEtapa(Request $request): JsonResponse { $data = $request->validate(['nombre' => ['required', 'string', 'max:100'], 'orden' => ['required', 'integer', 'min:0'], 'probabilidad' => ['required', 'integer', 'min:0', 'max:100'], 'tipo' => ['required', 'in:abierta,ganada,perdida']]); return ApiResponse::success(EtapaOportunidad::create([...$data, 'empresa_id' => $request->user()->empresa_id]), 'Etapa creada correctamente', 201); }

    public function oportunidades(Request $request): JsonResponse { return ApiResponse::success($this->paraEmpresaActual(Oportunidad::query())->with(['cliente', 'contacto', 'etapa', 'responsable'])->latest()->paginate($request->integer('per_page', 20))); }
    public function crearOportunidad(Request $request): JsonResponse
    {
        $data = $request->validate(['cliente_id' => ['required', 'integer'], 'contacto_id' => ['nullable', 'integer'], 'etapa_oportunidad_id' => ['required', 'integer'], 'responsable_id' => ['nullable', 'integer'], 'nombre' => ['required', 'string', 'max:200'], 'monto' => ['nullable', 'numeric', 'min:0'], 'fecha_cierre_estimada' => ['nullable', 'date'], 'descripcion' => ['nullable', 'string']]);
        $etapa = $this->resolverParaEmpresaActual(EtapaOportunidad::class, $data['etapa_oportunidad_id']);
        $this->validarRelaciones($data, ['cliente_id' => Cliente::class, 'contacto_id' => Contacto::class, 'responsable_id' => User::class]);
        $oportunidad = Oportunidad::create([...$data, 'empresa_id' => $request->user()->empresa_id, 'probabilidad' => $etapa->probabilidad]);
        $this->automatizaciones->dispatch('oportunidad.creada', $oportunidad);
        return ApiResponse::success($oportunidad->fresh()->load(['cliente', 'contacto', 'etapa', 'responsable']), 'Oportunidad creada correctamente', 201);
    }

    public function cambiarEtapa(Request $request, int $oportunidad): JsonResponse
    {
        $oportunidad = $this->resolverParaEmpresaActual(Oportunidad::class, $oportunidad);
        $data = $request->validate(['etapa_oportunidad_id' => ['required', 'integer'], 'razon_perdida' => ['nullable', 'string', 'max:255']]);
        $etapa = $this->resolverParaEmpresaActual(EtapaOportunidad::class, $data['etapa_oportunidad_id']);
        $oportunidad->update(['etapa_oportunidad_id' => $etapa->id, 'probabilidad' => $etapa->probabilidad, 'ganada_at' => $etapa->tipo === 'ganada' ? now() : null, 'perdida_at' => $etapa->tipo === 'perdida' ? now() : null, 'razon_perdida' => $etapa->tipo === 'perdida' ? $data['razon_perdida'] : null]);
        $this->automatizaciones->dispatch('oportunidad.etapa_cambiada', $oportunidad->fresh());
        return ApiResponse::success($oportunidad->fresh()->load('etapa'), 'Etapa actualizada correctamente');
    }

    public function actividades(Request $request): JsonResponse { return ApiResponse::success($this->paraEmpresaActual(Actividad::query())->with(['oportunidad', 'responsable'])->latest('programada_para')->paginate($request->integer('per_page', 20))); }
    public function crearActividad(Request $request): JsonResponse { $data = $request->validate(['cliente_id' => ['nullable', 'integer'], 'contacto_id' => ['nullable', 'integer'], 'oportunidad_id' => ['nullable', 'integer'], 'responsable_id' => ['nullable', 'integer'], 'tipo' => ['required', 'in:llamada,correo,reunion,tarea,nota'], 'asunto' => ['required', 'string', 'max:200'], 'descripcion' => ['nullable', 'string'], 'programada_para' => ['nullable', 'date']]); $this->validarRelaciones($data, ['cliente_id' => Cliente::class, 'contacto_id' => Contacto::class, 'oportunidad_id' => Oportunidad::class, 'responsable_id' => User::class]); return ApiResponse::success(Actividad::create([...$data, 'empresa_id' => $request->user()->empresa_id, 'creado_por_id' => $request->user()->id]), 'Actividad creada correctamente', 201); }
    public function completarActividad(int $actividad): JsonResponse { $actividad = $this->resolverParaEmpresaActual(Actividad::class, $actividad); $actividad->update(['estado' => 'completada', 'completada_at' => now()]); return ApiResponse::success($actividad, 'Actividad completada'); }

    public function automatizaciones(Request $request): JsonResponse { return ApiResponse::success($this->paraEmpresaActual(Automatizacion::query())->latest()->get()); }
    public function crearAutomatizacion(Request $request): JsonResponse
    {
        foreach (['filtros', 'acciones'] as $campo) {
            if (is_string($request->input($campo))) {
                $request->merge([$campo => json_decode($request->input($campo), true)]);
            }
        }
        $data = $request->validate(['nombre' => ['required', 'string', 'max:150'], 'evento' => ['required', 'in:oportunidad.creada,oportunidad.etapa_cambiada'], 'filtros' => ['nullable', 'array'], 'acciones' => ['required', 'array', 'min:1'], 'activa' => ['boolean']]);
        return ApiResponse::success(Automatizacion::create([...$data, 'empresa_id' => $request->user()->empresa_id]), 'Automatización creada correctamente', 201);
    }
    public function notificaciones(Request $request): JsonResponse { return ApiResponse::success($this->paraEmpresaActual(NotificacionCrm::query())->where('usuario_id', $request->user()->id)->latest()->paginate(20)); }
    public function leerNotificacion(Request $request, int $notificacion): JsonResponse { $item = $this->resolverParaEmpresaActual(NotificacionCrm::class, $notificacion); abort_unless($item->usuario_id === $request->user()->id, 404); $item->update(['leida_at' => now()]); return ApiResponse::success($item); }

    /** @param array<string, mixed> $datos @param array<string, class-string> $relaciones */
    private function validarRelaciones(array $datos, array $relaciones): void
    {
        foreach ($relaciones as $campo => $modelo) {
            if (!empty($datos[$campo])) {
                $this->resolverParaEmpresaActual($modelo, $datos[$campo]);
            }
        }
    }
}
