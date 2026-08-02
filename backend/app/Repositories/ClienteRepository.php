<?php

namespace App\Repositories;

use App\Models\Cliente;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Módulo Clientes (2026-08-02) — primer Repository de este proyecto.
 * Ningún otro módulo (Categoria/Marca/Proveedor/Stock/Usuarios) usa este
 * patrón todavía: sus Controllers consultan Eloquent directo. Introducido
 * aquí por decisión explícita de metodología del propietario del
 * proyecto ("Starting today" — vertical slice completo para módulos
 * nuevos), no retroactivamente aplicado a los módulos existentes.
 *
 * `TenantScope` (Módulo 2) ya filtra `Cliente::query()` por empresa
 * automáticamente — este Repository no necesita (ni debe) repetir ese
 * filtro a mano.
 */
class ClienteRepository
{
    /**
     * @param array{busqueda?: string, estado?: string} $filtros
     */
    public function paginar(array $filtros, int $porPagina = 20): LengthAwarePaginator
    {
        $query = Cliente::query();

        if (! empty($filtros['busqueda'])) {
            $busqueda = $filtros['busqueda'];
            $query->where(function ($q) use ($busqueda) {
                $q->where('nombre', 'like', "%{$busqueda}%")
                    ->orWhere('nit', 'like', "%{$busqueda}%")
                    ->orWhere('contacto', 'like', "%{$busqueda}%")
                    ->orWhere('email', 'like', "%{$busqueda}%");
            });
        }

        // Por defecto solo activos — inactivos visibles únicamente vía
        // filtro explícito (GLOBAL UI STANDARD, mismo criterio que
        // Proveedores/Categorías/Marcas/Unidades de Medida).
        if (($filtros['estado'] ?? null) !== 'todos') {
            $query->where('estado', $filtros['estado'] ?? 'activo');
        }

        return $query->orderBy('nombre')->paginate($porPagina);
    }

    public function crear(array $datos): Cliente
    {
        return Cliente::create($datos);
    }

    public function actualizar(Cliente $cliente, array $datos): Cliente
    {
        $cliente->update($datos);

        return $cliente;
    }

    public function cambiarEstado(Cliente $cliente, string $estado): Cliente
    {
        $cliente->update(['estado' => $estado]);

        return $cliente;
    }
}
