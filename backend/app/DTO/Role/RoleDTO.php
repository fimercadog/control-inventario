<?php

namespace App\DTO\Role;

/**
 * Módulo 5 — Role Management (2026-08-02, docs/security/ROLES_MATRIX.md
 * secciones 1/6). `permisos` es `null` cuando el payload no incluyó la
 * clave (no tocar la asignación actual), y `[]` cuando el cliente
 * explícitamente quiere dejar el rol sin ningún permiso — misma
 * distinción "no enviado" vs "enviado vacío" que `ClienteDTO` ya
 * resuelve para campos escalares, aplicada aquí a un array.
 */
final readonly class RoleDTO
{
    /**
     * @param array<int, string>|null $permisos nombres de permisos del catálogo global
     */
    public function __construct(
        public ?string $name = null,
        public ?string $estado = null,
        public ?array $permisos = null,
    ) {
    }

    /**
     * @param array<string, mixed> $datos típicamente `$request->validated()`
     */
    public static function fromArray(array $datos): self
    {
        return new self(
            name: $datos['name'] ?? null,
            estado: $datos['estado'] ?? null,
            permisos: array_key_exists('permisos', $datos) ? $datos['permisos'] : null,
        );
    }
}
