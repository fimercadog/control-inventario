<?php

namespace App\Reports;

use App\Models\Proveedor;
use App\Reports\Concerns\TerceroReporteBase;

class ReporteProveedores extends TerceroReporteBase
{
    public function clave(): string
    {
        return 'proveedores';
    }

    public function nombre(): string
    {
        return 'Reporte de Proveedores';
    }

    public function descripcion(): string
    {
        return 'Listado de proveedores con sus datos de contacto y estado.';
    }

    protected function modelo(): string
    {
        return Proveedor::class;
    }
}
