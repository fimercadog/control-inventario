<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('empresa_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->boolean('is_platform_admin')->default(false)->after('empresa_id');

            $table->string('avatar_path')->nullable()->after('password');
            $table->string('theme')->default('system')->after('avatar_path');
            $table->string('language')->default('es')->after('theme');
            $table->string('timezone')->default('America/Bogota')->after('language');
            $table->boolean('is_active')->default(true)->after('timezone');
            $table->timestamp('invited_at')->nullable()->after('is_active');
            $table->foreignId('invited_by')->nullable()->after('invited_at')->constrained('users')->nullOnDelete();

            $table->boolean('two_factor_enabled')->default(false)->after('invited_by');
            $table->text('two_factor_secret')->nullable()->after('two_factor_enabled');
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_secret');

            $table->timestamp('last_activity_at')->nullable()->after('two_factor_confirmed_at');
            $table->string('last_login_ip', 45)->nullable()->after('last_activity_at');
            $table->string('last_user_agent')->nullable()->after('last_login_ip');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('invited_by');
            $table->dropConstrainedForeignId('empresa_id');

            $table->dropColumn([
                'is_platform_admin',
                'avatar_path',
                'theme',
                'language',
                'timezone',
                'is_active',
                'invited_at',
                'two_factor_enabled',
                'two_factor_secret',
                'two_factor_confirmed_at',
                'last_activity_at',
                'last_login_ip',
                'last_user_agent',
            ]);
        });
    }
};
