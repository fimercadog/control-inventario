<?php

namespace App\Enums\CapturaIA;

enum EstadoCapturaDetalle: string
{
    case PendienteRevision = 'pendiente_revision';
    case Aplicado = 'aplicado';
    case Corregido = 'corregido';
    case Descartado = 'descartado';
}
