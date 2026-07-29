<?php

namespace Tests\Feature\Auth;

use App\Models\AuthSession;
use App\Models\Empresa;
use App\Models\User;
use App\Notifications\Auth\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_always_responds_generically_even_for_an_unknown_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/password/olvide', ['email' => 'no-existe@fideos.test']);

        $response->assertOk();
        $response->assertJsonPath('message', 'Si ese correo existe, enviamos un enlace para restablecer la contraseña.');
    }

    public function test_forgot_password_sends_a_reset_notification_pointing_to_the_frontend(): void
    {
        Notification::fake();

        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id, 'email' => 'demo@fideos.test']);

        $this->postJson('/api/v1/auth/password/olvide', ['email' => 'demo@fideos.test'])->assertOk();

        Notification::assertSentTo($user, ResetPasswordNotification::class);
    }

    public function test_a_user_can_reset_their_password_with_a_valid_token_and_all_sessions_are_revoked(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id, 'password' => 'vieja-contrasena']);

        // Simula una sesión activa previa, como si el usuario hubiera iniciado sesión antes.
        AuthSession::create([
            'user_id' => $user->id,
            'refresh_token_hash' => hash('sha256', 'algun-token'),
            'expires_at' => now()->addDays(7),
        ]);

        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nueva-contrasena-segura',
            'password_confirmation' => 'nueva-contrasena-segura',
        ]);

        $response->assertOk();
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('nueva-contrasena-segura', $user->fresh()->password));
        $this->assertSame(0, AuthSession::where('user_id', $user->id)->whereNull('revoked_at')->count());
    }

    public function test_reset_password_fails_cleanly_with_an_invalid_token(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);

        $response = $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => 'token-invalido',
            'email' => $user->email,
            'password' => 'nueva-contrasena-segura',
            'password_confirmation' => 'nueva-contrasena-segura',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'No pudimos restablecer tu contraseña. El enlace puede haber expirado.');
    }
}
