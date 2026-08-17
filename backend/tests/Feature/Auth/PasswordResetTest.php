<?php

namespace Tests\Feature\Auth;

use App\Models\AuditLog;
use App\Models\AuthSession;
use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use App\Notifications\Auth\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Spatie\Permission\PermissionRegistrar;
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

    public function test_reset_password_rejects_an_expired_token(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id, 'password' => 'vieja-contrasena']);

        $token = Password::createToken($user);

        // Retrocede el reloj del token más allá de la ventana de expiración
        // configurada (config('auth.passwords.users.expire'), 60 min).
        // Laravel no distingue "expirado" de "inválido" en la respuesta —
        // mismo mensaje genérico para ambos, consistente con el resto de
        // este módulo (no filtrar el motivo exacto del rechazo).
        DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->update(['created_at' => now()->subMinutes((int) config('auth.passwords.users.expire') + 1)]);

        $response = $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nueva-contrasena-segura',
            'password_confirmation' => 'nueva-contrasena-segura',
        ]);

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'No pudimos restablecer tu contraseña. El enlace puede haber expirado.');
        $this->assertTrue(Hash::check('vieja-contrasena', $user->fresh()->password));
    }

    public function test_reset_password_token_cannot_be_reused(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);

        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'primera-contrasena-nueva',
            'password_confirmation' => 'primera-contrasena-nueva',
        ])->assertOk();

        $response = $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'segunda-contrasena-nueva',
            'password_confirmation' => 'segunda-contrasena-nueva',
        ]);

        $response->assertStatus(422);
        $this->assertTrue(Hash::check('primera-contrasena-nueva', $user->fresh()->password));
    }

    public function test_reset_password_rejects_a_password_shorter_than_the_minimum(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'corta',
            'password_confirmation' => 'corta',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password');
    }

    public function test_reset_password_rejects_a_mismatched_confirmation(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nueva-contrasena-segura',
            'password_confirmation' => 'otra-cosa-distinta',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password');
    }

    public function test_old_password_stops_working_after_a_successful_reset(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id, 'password' => 'vieja-contrasena-real']);
        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nueva-contrasena-real',
            'password_confirmation' => 'nueva-contrasena-real',
        ])->assertOk();

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'vieja-contrasena-real',
        ])->assertStatus(401);
    }

    public function test_new_password_works_after_a_successful_reset(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id, 'password' => 'vieja-contrasena-real']);
        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nueva-contrasena-real',
            'password_confirmation' => 'nueva-contrasena-real',
        ])->assertOk();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'nueva-contrasena-real',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['data' => ['access_token', 'token_type', 'expires_in', 'user']]);
    }

    public function test_reset_token_does_not_work_with_a_different_users_email(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $userA = User::factory()->create(['empresa_id' => $empresa->id]);
        $userB = User::factory()->create(['empresa_id' => $empresa->id, 'password' => 'password-de-b']);

        $tokenDeA = Password::createToken($userA);

        $response = $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $tokenDeA,
            'email' => $userB->email,
            'password' => 'nueva-contrasena-segura',
            'password_confirmation' => 'nueva-contrasena-segura',
        ]);

        $response->assertStatus(422);
        $this->assertTrue(Hash::check('password-de-b', $userB->fresh()->password));
    }

    public function test_reset_password_does_not_alter_role_empresa_or_platform_admin_flags(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);

        app(PermissionRegistrar::class)->setPermissionsTeamId($empresa->id);
        $rol = Role::create(['name' => 'Supervisor', 'guard_name' => 'api', 'empresa_id' => $empresa->id]);

        $user = User::factory()->create(['empresa_id' => $empresa->id, 'is_platform_admin' => false]);
        $user->assignRole($rol);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nueva-contrasena-segura',
            'password_confirmation' => 'nueva-contrasena-segura',
        ])->assertOk();

        $fresco = $user->fresh();
        $this->assertSame($empresa->id, $fresco->empresa_id);
        $this->assertFalse((bool) $fresco->is_platform_admin);
        $this->assertTrue($fresco->hasRole($rol));
    }

    public function test_reset_password_writes_a_safe_audit_log_entry_never_the_real_password(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);
        $token = Password::createToken($user);

        $this->postJson('/api/v1/auth/password/restablecer', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'nueva-contrasena-secreta',
            'password_confirmation' => 'nueva-contrasena-secreta',
        ])->assertOk();

        $log = AuditLog::where('accion', 'auth.password_restablecido')
            ->where('usuario_id', $user->id)
            ->first();

        $this->assertNotNull($log);
        $this->assertSame(['password' => '(restablecido)'], $log->valores_nuevos);
        $this->assertStringNotContainsString('nueva-contrasena-secreta', json_encode($log->toArray()));
        $this->assertStringNotContainsString($token, json_encode($log->toArray()));
    }

    public function test_forgot_password_requests_are_rate_limited(): void
    {
        Notification::fake();

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/v1/auth/password/olvide', ['email' => 'rate-limit-test@fideos.test'])
                ->assertOk();
        }

        $this->postJson('/api/v1/auth/password/olvide', ['email' => 'rate-limit-test@fideos.test'])
            ->assertStatus(429);
    }
}
