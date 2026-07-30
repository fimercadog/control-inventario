<?php

namespace App\Services;

use App\Models\Producto;
use App\Models\Proveedor;
use App\Services\Audit\AuditLogger;
use Illuminate\Http\Request;

/**
 * FEATURE-003/FEATURE-005 (docs/03_FUNCTIONAL_SPEC/Suppliers.md): "Select
 * existing supplier or Create supplier quickly" — mutuamente excluyentes.
 * Extraído de ProductoController para reutilizarlo también desde
 * MovimientoController (FEATURE-009) sin duplicar la lógica.
 */
class ProveedorResolver
{
    public function __construct(private readonly AuditLogger $auditoria)
    {
    }

    /**
     * @param array<string, mixed> $datos
     * @return array{0: ?int, 1: ?string} [proveedor_id, nombre denormalizado]
     */
    public function resolver(Request $request, array $datos, ?Producto $producto = null): array
    {
        if (! empty($datos['proveedor_nuevo'])) {
            $proveedor = Proveedor::create(['nombre' => $datos['proveedor_nuevo']]);

            $this->auditoria->registrarAccionManual(
                empresaId: $proveedor->empresa_id,
                usuarioId: $request->user()->id,
                modulo: 'proveedores',
                accion: 'proveedores.crear_rapido',
                auditableType: Proveedor::class,
                auditableId: $proveedor->id,
                valoresNuevos: ['nombre' => $proveedor->nombre, 'origen' => 'registrar_ingreso'],
                ip: $request->ip(),
                userAgent: $request->userAgent(),
            );

            return [$proveedor->id, $proveedor->nombre];
        }

        if (! empty($datos['proveedor_id'])) {
            $proveedor = Proveedor::findOrFail($datos['proveedor_id']);

            return [$proveedor->id, $proveedor->nombre];
        }

        // FEATURE-005: sin selección explícita, cae al proveedor principal
        // asociado al producto (si existe) en vez de dejar el movimiento sin proveedor.
        $principal = $producto?->proveedorPrincipal();

        if ($principal !== null) {
            return [$principal->proveedor_id, $principal->proveedor?->nombre];
        }

        return [null, null];
    }
}
