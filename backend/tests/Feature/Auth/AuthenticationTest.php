<?php

namespace Tests\Feature\Auth;

use App\Models\AuthSession;
use App\Models\Empresa;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    private Empresa $empresa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empresa = Empresa::create(['nombre' => 'Fidel OS']);
    }

    public function test_a_user_can_log_in_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'empresa_id' => $this->empresa->id,
            'email' => 'demo@fideos.test',
            'password' => 'contrasena-correcta',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'demo@fideos.test',
            'password' => 'contrasena-correcta',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.user.email', 'demo@fideos.test');
        $response->assertJsonStructure(['data' => ['access_token', 'token_type', 'expires_in', 'user']]);
        $response->assertCookie('refresh_token');

        $this->assertDatabaseHas('security_logs', ['email' => 'demo@fideos.test', 'success' => 1]);
        $this->assertSame(1, AuthSession::where('user_id', $user->id)->count());
    }

    public function test_login_with_remember_me_creates_a_persistent_session(): void
    {
        $user = User::factory()->create([
            'empresa_id' => $this->empresa->id,
            'password' => 'contrasena-correcta',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'contrasena-correcta',
            'remember_me' => true,
        ]);

        $response->assertOk()->assertCookie('refresh_token');
        $this->assertDatabaseHas('auth_sessions', ['user_id' => $user->id, 'remember_me' => true]);
        $this->assertGreaterThan(time(), $response->headers->getCookies()[0]->getExpiresTime());
    }

    public function test_login_fails_with_the_wrong_password_and_never_reveals_which_field_was_wrong(): void
    {
        User::factory()->create([
            'empresa_id' => $this->empresa->id,
            'email' => 'demo@fideos.test',
            'password' => 'contrasena-correcta',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'demo@fideos.test',
            'password' => 'incorrecta',
        ]);

        $response->assertStatus(401);
        $response->assertJsonPath('message', 'Correo o contraseña incorrectos.');
        $this->assertDatabaseHas('security_logs', ['email' => 'demo@fideos.test', 'success' => 0, 'reason' => 'invalid_credentials']);
    }

    public function test_login_fails_for_a_nonexistent_email_with_the_exact_same_message(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'no-existe@fideos.test',
            'password' => 'cualquiera',
        ]);

        $response->assertStatus(401);
        $response->assertJsonPath('message', 'Correo o contraseña incorrectos.');
    }

    public function test_an_inactive_users_login_is_rejected(): void
    {
        User::factory()->create([
            'empresa_id' => $this->empresa->id,
            'email' => 'inactivo@fideos.test',
            'password' => 'contrasena-correcta',
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'inactivo@fideos.test',
            'password' => 'contrasena-correcta',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Esta cuenta está desactivada. Contacta a un administrador.');
    }

    public function test_a_user_with_an_unverified_email_cannot_log_in(): void
    {
        User::factory()->unverified()->create([
            'empresa_id' => $this->empresa->id,
            'email' => 'sinverificar@fideos.test',
            'password' => 'contrasena-correcta',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'sinverificar@fideos.test',
            'password' => 'contrasena-correcta',
        ]);

        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Debes verificar tu correo antes de iniciar sesión.');
    }

    public function test_refresh_rotates_the_token_and_the_old_one_stops_working(): void
    {
        $user = User::factory()->create(['empresa_id' => $this->empresa->id, 'password' => 'secreto123']);

        $login = $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'secreto123']);
        $firstAccessToken = $login->json('data.access_token');

        $refresh = $this->withCredentials()
            ->withUnencryptedCookie('refresh_token', $this->rawCookieValue($login))
            ->postJson('/api/v1/auth/refresh');

        $refresh->assertOk();
        $newAccessToken = $refresh->json('data.access_token');
        $this->assertNotSame($firstAccessToken, $newAccessToken);

        // El refresh token viejo ya fue rotado (revocado) — reusarlo falla.
        $reuseOldToken = $this->withCredentials()
            ->withUnencryptedCookie('refresh_token', $this->rawCookieValue($login))
            ->postJson('/api/v1/auth/refresh');

        $reuseOldToken->assertStatus(401);
    }

    public function test_refresh_without_a_cookie_fails_cleanly(): void
    {
        $response = $this->postJson('/api/v1/auth/refresh');

        $response->assertStatus(401);
        $response->assertJsonPath('message', 'Tu sesión expiró. Inicia sesión de nuevo.');
    }

    public function test_logout_revokes_the_session_and_blacklists_the_access_token(): void
    {
        $user = User::factory()->create(['empresa_id' => $this->empresa->id, 'password' => 'secreto123']);
        $login = $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'secreto123']);
        $accessToken = $login->json('data.access_token');

        $logout = $this->withHeader('Authorization', "Bearer {$accessToken}")
            ->withCredentials()
            ->withUnencryptedCookie('refresh_token', $this->rawCookieValue($login))
            ->postJson('/api/v1/auth/logout');

        $logout->assertOk();
        $this->assertSame(1, AuthSession::where('user_id', $user->id)->whereNotNull('revoked_at')->count());

        // El guard cachea el usuario resuelto en su propia instancia; una
        // request real siempre arranca con un guard nuevo, así que se
        // limpia aquí para simular fielmente una segunda request aparte.
        app('auth')->forgetGuards();

        // El mismo access token ya no sirve — está en la blacklist.
        $me = $this->withHeader('Authorization', "Bearer {$accessToken}")->getJson('/api/v1/auth/me');
        $me->assertStatus(401);
    }

    public function test_me_returns_the_authenticated_user_and_an_empty_permissions_list_when_none_are_assigned(): void
    {
        $user = User::factory()->create(['empresa_id' => $this->empresa->id]);
        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")->getJson('/api/v1/auth/me');

        $response->assertOk();
        $response->assertJsonPath('data.email', $user->email);
        $response->assertJsonPath('data.permissions', []);
    }

    public function test_business_routes_reject_anonymous_requests(): void
    {
        $response = $this->getJson('/api/v1/captura-ia');

        $response->assertStatus(401);
        $response->assertJsonPath('message', 'Debes iniciar sesión para continuar.');
    }

    public function test_business_routes_accept_an_authenticated_request(): void
    {
        $this->seed(PermissionSeeder::class);

        $user = User::factory()->create(['empresa_id' => $this->empresa->id]);

        // Esta ruta de negocio ahora exige captura-ia.usar (Fase 4.6,
        // Authorization Completion) además de autenticación — el foco de
        // este test es la autenticación en sí (par de
        // test_business_routes_reject_anonymous_requests), así que se le
        // otorga el permiso para que un 403 de autorización no se
        // confunda con un fallo de autenticación.
        app(PermissionRegistrar::class)->setPermissionsTeamId($this->empresa->id);
        $rol = Role::create(['name' => 'Test Captura IA', 'guard_name' => 'api', 'empresa_id' => $this->empresa->id]);
        $rol->givePermissionTo('captura-ia.usar');
        $user->assignRole($rol);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $token = JWTAuth::fromUser($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/captura-ia?empresa_id='.$this->empresa->id);

        $response->assertOk();
    }

    private function rawCookieValue(TestResponse $response): string
    {
        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === 'refresh_token') {
                return (string) $cookie->getValue();
            }
        }

        $this->fail('La respuesta no trae la cookie refresh_token.');
    }
}
