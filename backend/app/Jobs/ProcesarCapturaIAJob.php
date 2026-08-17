<?php

namespace App\Jobs;

use App\DTO\CapturaIA\CaptureInputDTO;
use App\Services\CapturaIA\CapturaIAService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Envoltorio queueable de CapturaIAService::procesar(). Existe para que
 * imágenes grandes y, a futuro, video (sección 74 del master spec, punto 8)
 * puedan procesarse en cola sin cambiar el contrato de la API: el
 * Controller de Fase 3 hoy llama a CapturaIAService directamente (síncrono,
 * QUEUE_CONNECTION=sync-equivalente); pasar a asíncrono real es dispatch
 * de este Job en vez de la llamada directa, sin tocar rutas ni Resources.
 * Mientras el Job corre, la captura queda en estado `procesando`.
 */
class ProcesarCapturaIAJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private readonly CaptureInputDTO $input,
        private readonly ?string $ip = null,
        private readonly ?string $userAgent = null,
    ) {
    }

    public function handle(CapturaIAService $servicio): void
    {
        $servicio->procesar($this->input, $this->ip, $this->userAgent);
    }
}
