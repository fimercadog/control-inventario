<?php

namespace App\Services;

use App\DTO\Cliente\ClienteDTO;
use App\Models\Cliente;
use App\Repositories\ClienteRepository;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Módulo Clientes (2026-08-02) — orquesta Repository + auditoría; el
 * Controller nunca llama `Cliente::` ni `ClienteRepository` directo.
 */
class ClienteService
{
    public function __construct(
        private readonly ClienteRepository $clientes,
        private readonly AuditLogger $auditoria,
    ) {}

    /**
     * @param  array{busqueda?: string, estado?: string}  $filtros
     */
    public function listar(array $filtros): LengthAwarePaginator
    {
        return $this->clientes->paginar($filtros);
    }

    public function crear(ClienteDTO $datos, Request $request): Cliente
    {
        $cliente = $this->clientes->crear([
            ...$datos->toArray(),
            'estado' => $datos->estado ?? 'activo',
        ]);

        $this->registrarAuditoria($request, $cliente, 'clientes.crear', $cliente->only(['nombre', 'nit']));

        return $cliente;
    }

    public function actualizar(Cliente $cliente, ClienteDTO $datos, Request $request): Cliente
    {
        $cliente = $this->clientes->actualizar($cliente, $datos->toArray());

        // getChanges(), no un ->only() fijo — captura exactamente los
        // campos que de verdad cambiaron (email/teléfono/etc. incluidos),
        // en vez de solo nombre/nit/estado. `updated_at` se excluye: se
        // toca en cada save, no es un cambio de negocio real.
        $cambios = collect($cliente->getChanges())->except('updated_at')->all();

        if ($cambios !== []) {
            $this->registrarAuditoria($request, $cliente, 'clientes.editar', $cambios);
        }

        return $cliente;
    }

    /**
     * GLOBAL RULE: "Physical DELETE is NEVER allowed from the UI." Único
     * mecanismo de "eliminar" un cliente — deshabilita, nunca borra la
     * fila.
     */
    public function deshabilitar(Cliente $cliente, Request $request): Cliente
    {
        $cliente = $this->clientes->cambiarEstado($cliente, 'inactivo');

        $this->registrarAuditoria($request, $cliente, 'clientes.deshabilitar', ['estado' => 'inactivo']);

        return $cliente;
    }

    public function habilitar(Cliente $cliente, Request $request): Cliente
    {
        $cliente = $this->clientes->cambiarEstado($cliente, 'activo');

        $this->registrarAuditoria($request, $cliente, 'clientes.habilitar', ['estado' => 'activo']);

        return $cliente;
    }

    /**
     * @param  array<string, mixed>  $valoresNuevos
     */
    private function registrarAuditoria(Request $request, Cliente $cliente, string $accion, array $valoresNuevos): void
    {
        $this->auditoria->registrarAccionManual(
            empresaId: $cliente->empresa_id,
            usuarioId: $request->user()?->id,
            modulo: 'clientes',
            accion: $accion,
            auditableType: Cliente::class,
            auditableId: $cliente->id,
            valoresNuevos: $valoresNuevos,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }
}
