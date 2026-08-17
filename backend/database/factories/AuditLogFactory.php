<?php

namespace Database\Factories;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AuditLog>
 *
 * Genera entradas de auditoría con la misma forma que las que ya escribe
 * `AuditLogger::registrarAccionManual()` en producción — usado para volumen
 * de datos demo, no reemplaza el flujo real de auditoría de cada módulo.
 */
class AuditLogFactory extends Factory
{
    protected $model = AuditLog::class;

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

    public function definition(): array
    {
        $accion = fake()->randomElement(self::ACCIONES);

        return [
            'modulo' => $accion['modulo'],
            'accion' => $accion['accion'],
            'auditable_type' => 'App\\Models\\Producto',
            'auditable_id' => fake()->numberBetween(1, 500),
            'valores_nuevos' => ['demo' => true],
            'resultado' => 'exitoso',
            'ip' => fake()->ipv4(),
            'user_agent' => 'Mozilla/5.0 (Demo Data Seeder)',
            'created_at' => fake()->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
