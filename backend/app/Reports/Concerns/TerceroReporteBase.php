<?php

namespace App\Reports\Concerns;

use App\Contracts\Reports\Reporte;
use App\DTO\Report\ReporteResultadoDTO;
use App\Http\Controllers\Concerns\FiltersByEmpresa;
use Illuminate\Database\Eloquent\Model;

/**
 * Base compartida por `ReporteProveedores` y `ReporteClientes` — `Cliente`
 * y `Proveedor` tienen exactamente el mismo shape de columnas (mismo
 * origen: Clientes se modeló copiando la tabla de Proveedores), así que
 * el reporte sobre cualquiera de los dos es la misma consulta con un
 * modelo distinto. Evita mantener dos copias idénticas de esta lógica.
 */
abstract class TerceroReporteBase implements Reporte
{
    use AplicaPaginacion;
    use FiltersByEmpresa;

    /** @return class-string<Model> */
    abstract protected function modelo(): string;

    public function filtrosDisponibles(): array
    {
        return [
            ['clave' => 'estado', 'etiqueta' => 'Estado', 'tipo' => 'select', 'requerido' => false],
            ['clave' => 'busqueda', 'etiqueta' => 'Buscar por nombre o NIT', 'tipo' => 'texto', 'requerido' => false],
        ];
    }

    public function generar(array $filtros, bool $paginado = true): ReporteResultadoDTO
    {
        $modelo = $this->modelo();

        $query = $this->paraEmpresaActual($modelo::query())
            ->when(($filtros['estado'] ?? 'activo') !== 'todos', fn ($q) => $q->where('estado', $filtros['estado'] ?? 'activo'))
            ->when($filtros['busqueda'] ?? null, fn ($q, $v) => $q->where(function ($sub) use ($v) {
                $sub->where('nombre', 'like', "%{$v}%")->orWhere('nit', 'like', "%{$v}%");
            }))
            ->orderBy('nombre');

        ['filas' => $registros, 'total' => $total] = $this->paginarConsulta($query, $filtros, $paginado);

        return new ReporteResultadoDTO(
            clave: $this->clave(),
            titulo: $this->nombre(),
            columnas: [
                ['clave' => 'nombre', 'etiqueta' => 'Nombre'],
                ['clave' => 'nit', 'etiqueta' => 'NIT'],
                ['clave' => 'contacto', 'etiqueta' => 'Contacto'],
                ['clave' => 'telefono', 'etiqueta' => 'Teléfono'],
                ['clave' => 'email', 'etiqueta' => 'Email'],
                ['clave' => 'ciudad', 'etiqueta' => 'Ciudad'],
                ['clave' => 'estado', 'etiqueta' => 'Estado'],
            ],
            filas: array_map(fn (Model $r) => [
                'nombre' => $r->nombre,
                'nit' => $r->nit ?? '—',
                'contacto' => $r->contacto ?? '—',
                'telefono' => $r->telefono ?? '—',
                'email' => $r->email ?? '—',
                'ciudad' => $r->ciudad ?? '—',
                'estado' => $r->estado === 'activo' ? 'Activo' : 'Inactivo',
            ], $registros),
            filtrosAplicados: $filtros,
            total: $total,
        );
    }
}
