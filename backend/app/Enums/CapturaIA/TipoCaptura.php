<?php

namespace App\Enums\CapturaIA;

/**
 * Tipos de captura soportados actualmente.
 *
 * La columna `capturas_ia.tipo` es VARCHAR (no ENUM de MySQL) para poder
 * agregar casos futuros sin migración: CodigoBarras, Qr, OcrFactura, Pdf, Video.
 * No agregar esos casos hasta que su fase correspondiente sea aprobada
 * (ver docs/00_MASTER_SPECIFICATION.md sección 74, "Extensibilidad futura").
 */
enum TipoCaptura: string
{
    case Foto = 'foto';
    case Voz = 'voz';
    case FotoVoz = 'foto_voz';
}
