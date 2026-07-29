# Guía de Despliegue

## Estado honesto

**No existe deploy automatizado ni pipeline de CI/CD en este repositorio.** Todo lo descrito abajo es el procedimiento manual real, derivado de `backend/.env.example`, `frontend/package.json`, y los pasos de arranque documentados en `DEMO.md` (que cubre el ambiente de demo local, no producción). No hay Dockerfile, no hay configuración de ningún proveedor cloud, no hay `.github/workflows`.

## Requisitos

- PHP 8.2+ con extensiones estándar de Laravel (sqlite3 o el driver de BD elegido, mbstring, openssl, pdo).
- Composer 2.x.
- Node.js 20+ y npm.
- Base de datos: SQLite para desarrollo/demo (`database/database.sqlite`); el `.env.example` no fija MySQL/PostgreSQL para producción — debe decidirse y configurarse aparte (`DB_CONNECTION`, `DB_HOST`, etc., ya están presentes como variables comentadas en `.env.example`).
- Una `OPENAI_API_KEY` válida y con saldo si se quiere Captura IA funcional de extremo a extremo.

## Backend (Laravel)

```bash
cd backend
composer install --no-dev --optimize-autoloader   # --no-dev en producción real; DEMO.md usa composer install a secas para desarrollo
cp .env.example .env   # si no existe
php artisan key:generate
# Configurar DB_CONNECTION y credenciales reales si no se usa SQLite
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan serve   # o el servidor real (nginx + php-fpm) en producción — no documentado aquí porque nunca se ha configurado
```

Variables de entorno críticas para producción, más allá de lo documentado en `DEMO.md` (que cubre el caso demo):

| Variable | Nota para producción |
|---|---|
| `APP_ENV` | Debe ser `production`, no `local`. |
| `APP_DEBUG` | Debe ser `false` — con `true`, aunque el manejador de excepciones ya evita filtrar detalles en las respuestas JSON (`ErrorHandlingTest`), es una capa de defensa adicional que no debe faltar. |
| `APP_KEY` | Generada por `php artisan key:generate`, nunca reusada entre ambientes. |
| `OPENAI_API_KEY` | Requerida para Captura IA real; nunca comprometida en el repo (no está en `.env.example` por diseño). |
| `QUEUE_CONNECTION` | Sigue en `sync`/`database` en el `.env.example` actual — si se activa el procesamiento asíncrono de Captura IA (`ProcesarCapturaIAJob`), esto debe apuntar a un driver real y requiere un worker corriendo (`php artisan queue:work`), lo cual **no está configurado ni documentado como parte de ningún proceso de deploy hoy**. |
| `SESSION_DRIVER`, `CACHE_STORE` | En `database` por defecto — válido para un solo servidor; si se escala horizontalmente, requiere revisión (Redis u otro store compartido). |

## Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local   # si no existe
npm run build
npm run start   # servidor de producción de Next.js
```

Variable crítica: `NEXT_PUBLIC_API_URL` debe apuntar al backend real de producción, no a `localhost:8000`.

## Lo que falta para un deploy real (gap, no procedimiento)

- **CI/CD**: no existe. No hay build/test/deploy automatizado ante push o merge.
- **Contenerización**: no existe Dockerfile ni docker-compose para ninguno de los dos servicios.
- **Infraestructura como código**: no existe.
- **Base de datos de producción**: no hay decisión documentada de motor (MySQL, según el stack declarado en `CLAUDE.md` raíz, pero sin configuración real probada más allá de SQLite para desarrollo).
- **Gestión de secretos**: `OPENAI_API_KEY` y `APP_KEY` se manejan hoy vía `.env` local — sin vault ni gestor de secretos de ningún proveedor.
- **Monitoreo/logging centralizado**: `LOG_CHANNEL=stack` local; sin integración a ningún servicio externo (Sentry, Datadog, CloudWatch, etc.).
- **Worker de colas para procesamiento asíncrono**: no configurado (ver nota de `QUEUE_CONNECTION` arriba).

## Recomendación

No tratar este documento como un manual de producción probado — es la mejor reconstrucción honesta de "cómo arrancar el sistema" a partir de lo que existe hoy en el repo. Antes de un primer deploy real fuera de una máquina de desarrollo o de una demo controlada, cada uno de los puntos de la sección anterior debe resolverse explícitamente, no asumirse.
