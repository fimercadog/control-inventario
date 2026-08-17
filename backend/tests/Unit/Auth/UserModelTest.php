<?php

namespace Tests\Unit\Auth;

use App\Models\Empresa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Contracts\JWTSubject;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_regular_user_belongs_to_an_empresa_and_is_not_a_platform_admin(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);

        $this->assertSame($empresa->id, $user->empresa_id);
        $this->assertFalse($user->is_platform_admin);
        $this->assertTrue($user->is_active);
    }

    public function test_a_platform_super_admin_can_exist_without_an_empresa(): void
    {
        $admin = User::factory()->create([
            'empresa_id' => null,
            'is_platform_admin' => true,
        ]);

        $this->assertNull($admin->empresa_id);
        $this->assertTrue($admin->is_platform_admin);
    }

    public function test_the_user_model_implements_jwt_subject_with_the_empresa_id_claim(): void
    {
        $empresa = Empresa::create(['nombre' => 'Fidel OS']);
        $user = User::factory()->create(['empresa_id' => $empresa->id]);

        $this->assertInstanceOf(JWTSubject::class, $user);
        $this->assertSame($user->id, $user->getJWTIdentifier());
        $this->assertSame(['empresa_id' => $empresa->id], $user->getJWTCustomClaims());
    }

    public function test_two_factor_and_activity_tracking_columns_default_safely(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($user->two_factor_enabled);
        $this->assertNull($user->two_factor_secret);
        $this->assertNull($user->two_factor_confirmed_at);
        $this->assertNull($user->last_activity_at);
        $this->assertNull($user->last_login_ip);
        $this->assertNull($user->last_user_agent);
    }

    public function test_the_two_factor_secret_is_never_serialized(): void
    {
        $user = User::factory()->create(['two_factor_secret' => 'a-fake-secret']);

        $this->assertArrayNotHasKey('two_factor_secret', $user->toArray());
    }
}
