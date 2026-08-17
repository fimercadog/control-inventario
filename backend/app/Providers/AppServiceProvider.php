<?php

namespace App\Providers;

use App\Contracts\AI\AIProviderInterface;
use App\Contracts\AI\SpeechTranscriberInterface;
use App\Contracts\AI\StructuredExtractorInterface;
use App\Contracts\AI\VisionAnalyzerInterface;
use App\Contracts\Auth\RefreshTokenServiceInterface;
use App\Models\ReporteHistorial;
use App\Models\ReporteProgramado;
use App\Policies\ReportePolicy;
use App\Services\AI\OpenAIProvider;
use App\Services\AI\OpenAIResponsesService;
use App\Services\AI\OpenAISpeechService;
use App\Services\AI\OpenAIVisionService;
use App\Services\Auth\RefreshTokenService;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Módulo Captura IA (docs/00_MASTER_SPECIFICATION.md sección 74, punto 2):
        // CaptureStrategy solo conoce AIProviderInterface. Sustituir OpenAI por
        // Claude/Gemini/Ollama/OpenRouter es cambiar únicamente este binding.
        $this->app->bind(AIProviderInterface::class, OpenAIProvider::class);

        // Colaboradores internos de OpenAIProvider (detalle de implementación,
        // no expuestos a Strategies ni Controllers).
        $this->app->bind(VisionAnalyzerInterface::class, OpenAIVisionService::class);
        $this->app->bind(SpeechTranscriberInterface::class, OpenAISpeechService::class);
        $this->app->bind(StructuredExtractorInterface::class, OpenAIResponsesService::class);

        // Módulo Auth (docs/04_ARCHITECTURE.md): AuthenticationService solo
        // conoce esta interfaz, nunca genera JWTs ni tokens opacos directamente.
        $this->app->bind(RefreshTokenServiceInterface::class, RefreshTokenService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Módulo Reportes — ampliación 2026-08-03: una sola Policy para
        // dos modelos, fuera de la convención 1:1 de auto-discovery —
        // ver el docblock de ReportePolicy.
        Gate::policy(ReporteHistorial::class, ReportePolicy::class);
        Gate::policy(ReporteProgramado::class, ReportePolicy::class);
    }
}
