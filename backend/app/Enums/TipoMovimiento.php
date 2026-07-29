<?php

namespace App\Enums;

enum TipoMovimiento: string
{
    case Entrada = 'entrada';
    case Salida = 'salida';
    case Ajuste = 'ajuste';
    case Conteo = 'conteo';
    case Transferencia = 'transferencia';
}
