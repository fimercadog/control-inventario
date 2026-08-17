<?php

namespace App\Models;

use App\Models\Concerns\BelongsToEmpresa;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Reportes programados (2026-08-03) — infraestructura "future-ready" a
 * propósito: define QUÉ se programaría, sin que exista todavía un motor
 * que lo ejecute. `ultima_ejecucion_at` queda siempre `null` hasta que
 * ese motor se construya (mismo patrón que `captura-ia.gestionar`).
 */
class ReporteProgramado extends Model
{
    use BelongsToEmpresa;
    use HasFactory;

    // Nombre de tabla explícito: el default de Eloquent para
    // `ReporteProgramado` sería "reporte_programados" (singular
    // "reporte"), pero la migración (y el nombre de dominio, "Reportes
    // Programados") usan el plural "reportes_programados".
    protected $table = 'reportes_programados';

    protected $fillable = [
        'empresa_id',
        'usuario_id',
        'nombre',
        'tipo_reporte',
        'filtros',
        'formato',
        'frecuencia',
        'destinatarios',
        'estado',
        'ultima_ejecucion_at',
        'proxima_ejecucion_at',
    ];

    protected function casts(): array
    {
        return [
            'filtros' => 'array',
            'destinatarios' => 'array',
            'ultima_ejecucion_at' => 'datetime',
            'proxima_ejecucion_at' => 'datetime',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_id');
    }
}
