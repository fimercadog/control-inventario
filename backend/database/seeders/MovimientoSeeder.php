<?php

namespace Database\Seeders;

use App\Enums\TipoMovimiento;
use App\Exceptions\StockInsuficienteException;
use App\Models\Empresa;
use App\Models\Producto;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Demo Data RC1. Cada movimiento se crea vía InventoryService::registrarMovimiento()
 * — el mismo y único punto de escritura de stock_actual que usa Captura IA y
 * el ingreso manual en producción (docs/00_MASTER_SPECIFICATION.md sección
 * 74, "Propiedad exclusiva del stock") — nunca se escribe stock_actual
 * directo, ni siquiera en datos de demostración.
 *
 * El servicio siempre marca `created_at = now()`; para que el historial se
 * vea realista (movimientos repartidos en los últimos meses, no todos en
 * el mismo segundo) se retrasa `created_at`/`updated_at` con un UPDATE
 * puntual después de cada creación — nunca se toca `stock_anterior`/
 * `stock_nuevo`, que siguen siendo el snapshot inmutable real del momento
 * en que se calculó.
 */
class MovimientoSeeder extends Seeder
{
    public function crear(Empresa $empresa, int $cantidadTotal): int
    {
        $productos = Producto::where('empresa_id', $empresa->id)->get();

        if ($productos->isEmpty()) {
            return 0;
        }

        $servicio = app(InventoryService::class);
        $usuarioIds = DB::table('users')->where('empresa_id', $empresa->id)->pluck('id')->all();
        $creados = 0;
        $porProducto = (int) max(1, floor($cantidadTotal / $productos->count()));

        foreach ($productos as $producto) {
            for ($i = 0; $i < $porProducto; $i++) {
                $tipo = $this->tipoAleatorio();
                $cantidad = fake()->randomFloat(2, 1, 50);
                $usuarioId = $usuarioIds === [] ? null : fake()->randomElement($usuarioIds);

                try {
                    $movimiento = $servicio->registrarMovimiento(
                        producto: $producto,
                        tipo: $tipo,
                        cantidad: $cantidad,
                        documento: fake()->optional(0.4)->bothify('FAC-####'),
                        observacion: fake()->optional(0.3)->sentence(),
                        usuarioId: $usuarioId,
                        costo: fake()->optional(0.5)->randomFloat(2, 5, 200),
                    );
                } catch (StockInsuficienteException) {
                    // Una Salida/Ajuste negativo que dejaría stock negativo se
                    // omite — es exactamente la misma regla de negocio que
                    // protege al sistema en producción, no un error de seeding.
                    continue;
                }

                $fecha = fake()->dateTimeBetween('-6 months', 'now');
                DB::table('movimientos')
                    ->where('id', $movimiento->id)
                    ->update(['created_at' => $fecha, 'updated_at' => $fecha]);

                $creados++;
            }
        }

        return $creados;
    }

    private function tipoAleatorio(): TipoMovimiento
    {
        return fake()->randomElement([
            TipoMovimiento::Entrada, TipoMovimiento::Entrada, TipoMovimiento::Entrada,
            TipoMovimiento::Salida, TipoMovimiento::Salida,
            TipoMovimiento::Ajuste,
        ]);
    }
}
