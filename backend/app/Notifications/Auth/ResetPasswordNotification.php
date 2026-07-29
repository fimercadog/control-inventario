<?php

namespace App\Notifications\Auth;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notifiable;

/**
 * Igual que la notificación por defecto de Laravel, salvo que el botón
 * apunta a la pantalla del frontend (/restablecer-password), no a una
 * ruta web de esta API — no hay vistas server-side aquí.
 */
class ResetPasswordNotification extends ResetPassword
{
    public function toMail(mixed $notifiable): MailMessage
    {
        /** @var Notifiable&\Illuminate\Contracts\Auth\CanResetPassword $notifiable */
        $url = rtrim((string) config('app.frontend_url'), '/').'/restablecer-password?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);

        return (new MailMessage())
            ->subject('Restablece tu contraseña — Fidel OS')
            ->line('Recibimos una solicitud para restablecer tu contraseña.')
            ->action('Restablecer contraseña', $url)
            ->line('Si no solicitaste esto, puedes ignorar este correo.');
    }
}
