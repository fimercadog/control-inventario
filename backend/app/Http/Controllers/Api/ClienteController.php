<?php

namespace App\Http\Controllers\Api;

use App\DTO\Cliente\ClienteDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\Cliente\StoreClienteRequest;
use App\Http\Requests\Cliente\UpdateClienteRequest;
use App\Http\Resources\Cliente\ClienteResource;
use App\Http\Support\ApiResponse;
use App\Models\Cliente;
use App\Services\ClienteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Módulo Clientes (2026-08-02) — primer módulo construido bajo la
 * metodología de vertical slice completo (Repository+Service+DTO), sin
 * placeholder. Mismo patrón de aislamiento que Proveedores:
 * route-model-binding + `TenantScope` automático + Policy como segunda
 * capa. Borrado siempre lógico (`estado = inactivo`) — nunca un DELETE
 * físico expuesto por este controller.
 */
class ClienteController extends Controller
{
    public function __construct(
        private readonly ClienteService $clientes,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Cliente::class);

        $clientes = $this->clientes->listar([
            'busqueda' => $request->query('busqueda'),
            'estado' => $request->query('estado'),
        ]);

        return ApiResponse::success([
            'items' => ClienteResource::collection($clientes)->resolve(),
            'meta' => [
                'current_page' => $clientes->currentPage(),
                'per_page' => $clientes->perPage(),
                'total' => $clientes->total(),
                'last_page' => $clientes->lastPage(),
            ],
        ]);
    }

    public function store(StoreClienteRequest $request): JsonResponse
    {
        $this->authorize('create', Cliente::class);

        $cliente = $this->clientes->crear(ClienteDTO::fromArray($request->validated()), $request);

        return ApiResponse::success(new ClienteResource($cliente), 'Cliente creado correctamente', 201);
    }

    public function show(Cliente $cliente): JsonResponse
    {
        $this->authorize('view', $cliente);

        return ApiResponse::success(new ClienteResource($cliente));
    }

    public function update(UpdateClienteRequest $request, Cliente $cliente): JsonResponse
    {
        $this->authorize('update', $cliente);

        $cliente = $this->clientes->actualizar($cliente, ClienteDTO::fromArray($request->validated()), $request);

        return ApiResponse::success(new ClienteResource($cliente), 'Cliente actualizado correctamente');
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Único
     * mecanismo de "eliminar" un cliente — deshabilita, nunca borra la
     * fila.
     */
    public function disable(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorize('delete', $cliente);

        $cliente = $this->clientes->deshabilitar($cliente, $request);

        return ApiResponse::success(new ClienteResource($cliente), 'Cliente deshabilitado correctamente');
    }

    public function enable(Request $request, Cliente $cliente): JsonResponse
    {
        $this->authorize('update', $cliente);

        $cliente = $this->clientes->habilitar($cliente, $request);

        return ApiResponse::success(new ClienteResource($cliente), 'Cliente habilitado correctamente');
    }
}
