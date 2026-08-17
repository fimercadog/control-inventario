<?php

namespace Database\Seeders;

use App\Models\Empresa;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Demo Data RC1. Volumen de auditoría (miles de filas) generado por
 * inserción en bloque directa a la tabla — llamar a AuditLogger::registrarAccionManual()
 * miles de veces no aportaría nada distinto (la forma final de la fila es
 * idéntica) y sería mucho más lento. No reemplaza el flujo real de
 * auditoría de cada módulo, que sigue siendo el único que escribe
 * auditoría durante el uso real de la aplicación.
 */
class AuditLogSeeder extends Seeder
{
    private const ACCIONES = [
        ['modulo' => 'productos', 'accion' => 'productos.crear_manual'],
        ['modulo' => 'movimientos', 'accion' => 'movimientos.registrar_ingreso_manual'],
        ['modulo' => 'proveedores', 'accion' => 'proveedores.crear'],
        ['modulo' => 'proveedores', 'accion' => 'proveedores.editar'],
        ['modulo' => 'proveedores', 'accion' => 'proveedores.deshabilitar'],
        ['modulo' => 'producto_proveedor', 'accion' => 'producto_proveedor.crear'],
        ['modulo' => 'producto_proveedor', 'accion' => 'producto_proveedor.editar'],
        ['modulo' => 'captura-ia', 'accion' => 'captura-ia.confirmar'],
        ['modulo' => 'captura-ia', 'accion' => 'captura-ia.descartar'],
    ];

    public function crear(Empresa $empresa, int $cantidad): int
    {
        $usuarioIds = DB::table('users')->where('empresa_id', $empresa->id)->pluck('id')->all();
        $productoIds = DB::table('productos')->where('empresa_id', $empresa->id)->pluck('id')->all();

        if ($productoIds === []) {
            return 0;
        }

        $ahora = now();
        $insertados = 0;

        foreach (array_chunk(range(1, $cantidad), 500) as $lote) {
            $filas = array_map(function () use ($empresa, $usuarioIds, $productoIds, $ahora) {
                $accion = fake()->randomElement(self::ACCIONES);

                return [
                    'uuid' => (string) Str::uuid(),
                    'empresa_id' => $empresa->id,
                    'usuario_id' => $usuarioIds === [] ? null : fake()->randomElement($usuarioIds),
                    'modulo' => $accion['modulo'],
                    'accion' => $accion['accion'],
                    'auditable_type' => 'App\\Models\\Producto',
                    'auditable_id' => fake()->randomElement($productoIds),
                    'valores_anteriores' => null,
                    'valores_nuevos' => json_encode(['demo' => true]),
                    'resultado' => 'exitoso',
                    'ip' => fake()->ipv4(),
                    'user_agent' => 'Mozilla/5.0 (Demo Data Seeder)',
                    'created_at' => fake()->dateTimeBetween('-6 months', $ahora),
                ];
            }, $lote);

            DB::table('audit_logs')->insert($filas);
            $insertados += count($filas);
        }

        return $insertados;
    }
}
