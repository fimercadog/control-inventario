# Deployment — Technical Spec

> Deriva de lo verificable en `backend/composer.json`, `backend/.env.example`, `frontend/package.json`, `frontend/.env.example`, y de master spec §61-64 (Arquitectura Física, Escalabilidad) donde no contradice la realidad. **No existe un pipeline de CI/CD en este repositorio** — se documenta explícitamente como brecha, no se inventa uno (ver `docs/SDD_MIGRATION_PLAN.md` §1.1, §4).

## 1. Estado real: no hay CI/CD

No se encontró ningún workflow de GitHub Actions, GitLab CI, ni script de despliegue automatizado en el repositorio. `composer.json` define scripts locales (`composer setup`, `composer dev`, `composer test`) pensados para desarrollo, no para un pipeline. Esto es un gap real y activo: cualquier despliegue hoy es manual. Antes de un release a producción, este documento exige que exista al menos:

1. Un paso de instalación de dependencias (`composer install --no-dev`, `npm ci`).
2. Análisis estático (`laravel/pint` ya está instalado como dev-dependency — no se encontró configuración de ejecución obligatoria en CI).
3. Ejecución de la suite de tests (`composer test` corre `php artisan config:clear` + PHPUnit — ver `docs/06_TESTS/AutomatedTests.md`).
4. Build de frontend (`npm run build`, `npm run type-check`, `npm run lint` — todos scripts existentes en `package.json`, ninguno cableado a un pipeline).

Hasta que este pipeline exista, todo el flujo "Instalar → Análisis estático → Pruebas → Build → Deploy Staging → QA" del master spec §67 es aspiracional, no implementado.

## 2. Arquitectura física objetivo (master spec §73, no verificable en código — es infraestructura, no repositorio)

```
Cliente → Cloudflare → Nginx → Next.js → Laravel API → MySQL → Storage → Backups
```

Esto es la topología documentada por el master spec; no hay evidencia en el repositorio de configuración de Nginx, Cloudflare, ni de backups automatizados (no hay `Dockerfile`, `docker-compose.yml`, ni configuración de infraestructura como código en el repo auditado). *(Inferido del master spec — sin verificación en código; flag explícito.)*

## 3. Requisitos de entorno reales

### Backend (`backend/.env.example`)

| Variable | Propósito |
|---|---|
| `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL` | Config estándar Laravel — `APP_DEBUG` debe ser `false` en producción (nunca exponer stack traces, `AGENTS.md`) |
| `DB_CONNECTION` (default `sqlite` en dev) | Producción usa MySQL según `Database.md` — cambiar a `mysql` + credenciales antes de desplegar |
| `JWT_SECRET`, `JWT_TTL` | Generar con `php artisan jwt:secret`, nunca reusar el de desarrollo |
| `AUTH_REFRESH_TOKEN_TTL_DAYS`, `AUTH_REFRESH_TOKEN_REMEMBER_TTL_DAYS` | TTL de sesión (7 / 30 días) |
| `FRONTEND_URL` | Origen exacto permitido por CORS — nunca `*`, obligatorio para cookies httpOnly con credenciales |
| `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_*_MODEL`, `OPENAI_TIMEOUT` | Proveedor de IA (ver `Integrations.md`) |
| `CAPTURA_IA_CONFIDENCE_THRESHOLD` | Umbral de auto-aplicación (default 0.85) |
| `QUEUE_CONNECTION` (default `database`) | `ProcesarCapturaIAJob` está preparado para colas, hoy el Controller lo llama de forma síncrona |
| `MAIL_MAILER` (default `log` en dev) | Cambiar a un driver real (SES/SendGrid/SMTP) antes de producción — reset de contraseña depende de esto |

### Frontend (`frontend/.env.example`)

| Variable | Propósito |
|---|---|
| `NEXT_PUBLIC_API_URL` | Debe apuntar al dominio real de la API en producción; default `http://localhost:8000/api/v1` |

## 4. Checklist mínimo antes de un release a producción (derivado de brechas reales de `Security.md`, no del master spec aspiracional)

- [ ] `APP_DEBUG=false`, `APP_ENV=production`.
- [ ] `DB_CONNECTION=mysql` con credenciales de producción, no SQLite.
- [ ] `JWT_SECRET` único y distinto al de desarrollo/staging.
- [ ] `FRONTEND_URL` fijado al dominio real (no `localhost`).
- [ ] Cookie del refresh token con `Secure=true` (requiere HTTPS en producción — verificar configuración del servidor, no hay bandera explícita separada en `.env.example`).
- [ ] Rate limiting real en `/auth/login` y `/auth/password/olvide` (brecha conocida, ver `Security.md` §7).
- [ ] Headers de seguridad (CSP, HSTS, etc.) — brecha conocida, ver `Security.md` §8.
- [ ] `MAIL_MAILER` con un driver real, no `log`.
- [ ] Suite de tests (94 tests backend) pasando — ejecutar `composer test` manualmente hasta que exista CI.
- [ ] `npm run build` y `npm run type-check` sin errores.

## 5. Escalabilidad (master spec §64, evergreen — sin cambios frente al código real)

Backend stateless (Laravel API, sin sesión en servidor — la autenticación es JWT); frontend Next.js desplegable independientemente del backend. Cache (Redis) y colas distribuidas (SQS) están listadas como "fase futura" en el master spec — `QUEUE_CONNECTION=database` en `.env.example` confirma que hoy las colas usan la tabla `jobs` de la base de datos, no Redis/SQS todavía.
