<?php

namespace App\Reports;

use App\Models\Cliente;
use App\Reports\Concerns\TerceroReporteBase;

class ReporteClientes extends TerceroReporteBase
{
    public function clave(): string
    {
        return 'clientes';
    }

    public function nombre(): string
    {
        return 'Reporte de Clientes';
    }

    public function descripcion(): string
    {
        return 'Listado de clientes con sus datos de contacto y estado.';
    }

    protected function modelo(): string
    {
        return Cliente::class;
    }
}
