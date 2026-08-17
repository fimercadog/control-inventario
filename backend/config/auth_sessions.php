<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Refresh tokens — Módulo Auth (Fase 5)
    |--------------------------------------------------------------------------
    |
    | El access token es un JWT de corta duración (JWT_TTL, en minutos, ver
    | config/jwt.php). El refresh token es opaco (no JWT) y vive en la tabla
    | auth_sessions, hasheado, para poder revocarse individualmente —
    | ver docs/04_ARCHITECTURE.md, sección "Flujo de tokens".
    |
    */
    'refresh_ttl_days' => (int) env('AUTH_REFRESH_TOKEN_TTL_DAYS', 7),
    'refresh_ttl_remember_days' => (int) env('AUTH_REFRESH_TOKEN_REMEMBER_TTL_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Cookie del refresh token
    |--------------------------------------------------------------------------
    |
    | 'Secure' exige HTTPS: en local (http://localhost) el navegador
    | descarta la cookie si se marca Secure, por eso el default depende
    | del entorno en vez de ser siempre true.
    |
    */
    'cookie_name' => 'refresh_token',
    'cookie_secure' => (bool) env('AUTH_COOKIE_SECURE', ! in_array(env('APP_ENV', 'production'), ['local', 'testing'], true)),
    'cookie_same_site' => env('AUTH_COOKIE_SAME_SITE', 'lax'),

];
