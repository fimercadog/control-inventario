<?php

namespace App\Notifications\Auth;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Módulo 6 — Invitaciones (2026-08-03). Mismo patrón que
 * `ResetPasswordNotification`: el botón apunta al frontend, no a una
 * ruta web de esta API. Se envía vía `Notification::route('mail', ...)`
 * — el invitado todavía no tiene un `User`/`Notifiable` al que atarla.
 */
class InvitationNotification extends Notification
{
    public function __construct(
        private readonly string $rawToken,
        private readonly string $empresaNombre,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(mixed $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $url = rtrim((string) config('app.frontend_url'), '/').'/aceptar-invitacion?'.http_build_query([
            'token' => $this->rawToken,
        ]);

        return (new MailMessage)
            ->subject("Te invitaron a unirte a {$this->empresaNombre} — Fidel OS")
            ->line("Te invitaron a unirte a {$this->empresaNombre} en Fidel OS.")
            ->action('Aceptar invitación', $url)
            ->line('Este enlace expira en 7 días. Si no esperabas esta invitación, puedes ignorar este correo.');
    }
}
