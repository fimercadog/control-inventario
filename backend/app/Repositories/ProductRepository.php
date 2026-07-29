<?php

namespace App\Repositories;

use App\Models\Producto;

class ProductRepository
{
    /**
     * Coincidencia de identidad de producto: nombre + marca + presentación,
     * dentro de la misma empresa (ver sección 74 del master spec).
     */
    public function buscarPorNombreMarcaPresentacion(
        int $empresaId,
        string $nombre,
        ?string $marca,
        ?string $presentacion,
    ): ?Producto {
        return Producto::query()
            ->where('empresa_id', $empresaId)
            ->whereRaw('LOWER(nombre) = ?', [mb_strtolower(trim($nombre))])
            ->when(
                $marca !== null,
                fn ($query) => $query->whereRaw('LOWER(marca) = ?', [mb_strtolower(trim($marca))]),
                fn ($query) => $query->whereNull('marca'),
            )
            ->when(
                $presentacion !== null,
                fn ($query) => $query->whereRaw('LOWER(presentacion) = ?', [mb_strtolower(trim($presentacion))]),
                fn ($query) => $query->whereNull('presentacion'),
            )
            ->first();
    }
}
