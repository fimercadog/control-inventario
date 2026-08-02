<?php

namespace App\DTO\Cliente;

/**
 * Datos ya validados (por `StoreClienteRequest`/`UpdateClienteRequest`)
 * que el Controller entrega a `ClienteService` — nunca un array crudo.
 *
 * Guarda tanto las propiedades tipadas (para lectura cómoda) como el
 * array original ya filtrado a las claves realmente presentes en el
 * payload (`toArray()`) — necesario porque un campo `nullable` puede
 * enviarse explícitamente como `null` para "vaciar" el campo, algo
 * distinto de "el cliente no envió este campo". Colapsar ambos casos en
 * un solo `null` (p. ej. con `array_filter(fn ($v) => $v !== null)`)
 * rompería silenciosamente ese caso — mismo comportamiento que
 * `$request->validated()` ya tiene en el resto del proyecto (Proveedor,
 * Categoría, etc.), que este DTO no debe degradar.
 */
final readonly class ClienteDTO
{
    /**
     * @param array<string, mixed> $datosValidados solo las claves presentes en el payload original
     */
    public function __construct(
        public ?string $nombre = null,
        public ?string $nit = null,
        public ?string $contacto = null,
        public ?string $telefono = null,
        public ?string $email = null,
        public ?string $direccion = null,
        public ?string $ciudad = null,
        public ?string $pais = null,
        public ?string $notas = null,
        public ?string $estado = null,
        private array $datosValidados = [],
    ) {
    }

    /**
     * @param array<string, mixed> $datos típicamente `$request->validated()`
     */
    public static function fromArray(array $datos): self
    {
        return new self(
            nombre: $datos['nombre'] ?? null,
            nit: $datos['nit'] ?? null,
            contacto: $datos['contacto'] ?? null,
            telefono: $datos['telefono'] ?? null,
            email: $datos['email'] ?? null,
            direccion: $datos['direccion'] ?? null,
            ciudad: $datos['ciudad'] ?? null,
            pais: $datos['pais'] ?? null,
            notas: $datos['notas'] ?? null,
            estado: $datos['estado'] ?? null,
            datosValidados: $datos,
        );
    }

    /**
     * Exactamente las claves que venían en el payload original — apto
     * para pasar directo a `Model::create()`/`Model::update()`.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return $this->datosValidados;
    }
}
